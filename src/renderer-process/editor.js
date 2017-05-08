// Imports
const electron = require('electron')
const remote = electron.remote
const PIXI = require('pixi.js')
const path = require('path')
const controller = require('./controller.js')
const status = require('./status.js')
const Stage = require('./stage.js').Stage
const fs = require('fs-extra')

// Aliases
var Container = PIXI.Container,
    Sprite = PIXI.Sprite,
    TextureCache = PIXI.utils.TextureCache,
    Graphics = PIXI.Graphics

// Constants
const ROUND_ROTATION = Math.PI / 4 // When rounding angles, this is the step size to use

// Vars
var project
var stage // Stage instance
var asset // asset being moved (outside of pixi)
var scale = 1 // scale of the editor view
var puppet // puppet being edited
var character // character being edited
var layer // layer being edited
var clickableAssets = [] // assets in editor that are clickable
var selected // selected asset inside of pixi
var selectedGui // gui that appears around selected

exports.init = function() {
    project = remote.getGlobal('project').project
    // Create some basic objects
    stage = new Stage('editor-screen', {'numCharacters': 1, 'minSlotWidth': 0, 'assets': project.project.assets}, project.assets, project.assetsPath)
    stage.stage.interactive = true
    stage.stage.on('mousedown', editorMousedown)
    stage.stage.on('mousemove', editorMousemove)
    stage.stage.on('mouseup', editorMouseup)
    window.addEventListener('mouseup', mouseUp, false)

    // Override some parts of the stage
    stage.resize = function() {
        this.renderer.resize(this.screen.clientWidth, this.screen.clientHeight)
        this.slotWidth = this.screen.clientWidth / this.project.numCharacters
        this.stage.scale.x = this.stage.scale.y = scale
        puppet.container.y = this.screen.clientHeight / scale
        puppet.container.x = (this.screen.clientWidth / scale) / 2
        selected = null
        if (selectedGui) this.stage.removeChild(selectedGui)
    }
    stage.getAsset = function(asset, layer) {
        var sprite = new Sprite(TextureCache[path.join(this.assetsPath, this.assets[asset.tab][asset.hash].location)])
        sprite.anchor.set(0.5)
        sprite.x = asset.x
        sprite.y = asset.y
        sprite.rotation = asset.rotation
        sprite.scale.x = asset.scaleX
        sprite.scale.y = asset.scaleY
        sprite.layer = layer
        sprite.asset = asset
        clickableAssets.push(sprite)
        return sprite
    }

    // Make mousedown work on entire stage
    var backdrop = new PIXI.Container();
    backdrop.interactive = true;
    backdrop.containsPoint = () => true;
    stage.stage.addChild(backdrop)

    // Update Editor
    var tabs = document.getElementById('asset list')
    var tabsList = document.getElementById('asset tabs')
    var assetKeys = Object.keys(project.assets)
    for (var i = 0; i < assetKeys.length; i++) {
        var tab = project.assets[assetKeys[i]]
        var keys = Object.keys(tab)
        var tabElement = document.createElement('div')
        var tabOption = document.createElement('option')
        tabOption.text = assetKeys[i]
        tabOption.id = "tab option " + assetKeys[i]
        tabsList.add(tabOption)
        tabs.appendChild(tabElement)
        tabElement.style.display = 'none'
        tabElement.style.height = '100%'
        tabElement.id = 'tab ' + assetKeys[i]
        tabElement.className = 'scroll'
        for (var j = 0; j < keys.length; j++) {
            exports.addAsset(assetKeys[i], keys[j])
        }
    }
    if (assetKeys[0])
        document.getElementById('tab ' + assetKeys[0]).style.display = ''

    // DOM listeners
    document.getElementById('editor-save').addEventListener('click', savePuppet)
    document.getElementById('editor-new').addEventListener('click', newPuppet)
    document.getElementById('editor-duplicate').addEventListener('click', dupePuppet)
    document.getElementById('editor-import').addEventListener('click', importPuppet)
    document.getElementById('editor-open').addEventListener('click', openPuppetPanel)
    document.getElementById('char open search').addEventListener('keyup', updateCharSearch)
    document.getElementById('char open search').addEventListener('search', updateCharSearch)
    document.getElementById('editor-layers').addEventListener('click', toggleLayers)
    var buttons = document.getElementById('editor-layers-panel').getElementsByTagName('button')
    for (var i = 0; i < buttons.length; i++)
        buttons[i].addEventListener('click', setLayer)
    var emotes = document.getElementById('editor-layers-panel').getElementsByClassName('emote')
    for (var i = 0; i < emotes.length; i++)
        emotes[i].addEventListener('contextmenu', layerContextMenu)
    document.getElementById('editor-babble').addEventListener('click', toggleBabble)
    emotes = document.getElementById('babble-mouths').getElementsByClassName('emote')
    for (var i = 0; i < emotes.length; i++)
        emotes[i].addEventListener('click', mouthLayerClick)
    emotes = document.getElementById('babble-eyes').getElementsByClassName('emote')
    for (var i = 0; i < emotes.length; i++)
        emotes[i].addEventListener('click', eyesLayerClick)
    document.getElementById('editor-settings').addEventListener('click', toggleSettings)
    document.getElementById('editor-name').addEventListener('change', nameChange)
    document.getElementById('deadbonesstyle').addEventListener('click', bobbleChange)
    document.getElementById('delete-character').addEventListener('click', deleteCharacter)
    document.getElementById('add-asset').addEventListener('click', addAsset)
    document.getElementById('new-asset-bundle').addEventListener('click', () => {
        status.log('Not Yet Implemented!')
    })
    document.getElementById('edit-asset-list').addEventListener('click', editAssetList)
    document.getElementById('close-edit-asset-list').addEventListener('click', closeAssetListEditor)
    document.getElementById('asset-list-name').addEventListener('change', renameAssetList)
    document.getElementById('delete-asset-list').addEventListener('click', deleteAssetList)
    document.getElementById('new-asset-list').addEventListener('click', newAssetList)
    document.getElementById('import-asset-list').addEventListener('click', importAssetList)
    document.getElementById('asset selected').addEventListener('click', selectAsset)
    for (var i = 0; i < project.project.assets.length; i++) {
        var tabOption = document.createElement('option')
        tabOption.text = project.project.assets[i].name
        tabOption.id = 'asset-tab option ' + project.project.assets[i].name
        document.getElementById('asset-tab').add(tabOption)
    }
    document.getElementById('asset-tab').addEventListener('change', migrateAsset)
    document.getElementById('asset-name').addEventListener('change', renameAsset)
    document.getElementById('delete-asset').addEventListener('click', deleteAsset)
    document.getElementById('asset tabs').addEventListener('change', assetTabs)
    document.getElementById('asset search').addEventListener('keyup', updateAssetSearch)
    document.getElementById('asset search').addEventListener('search', updateAssetSearch)
    document.getElementById('zoom in').addEventListener('click', zoomIn)
    document.getElementById('zoom out').addEventListener('click', zoomOut)

    // Receive messages from application menu
    electron.ipcRenderer.on('cut', cut)
    electron.ipcRenderer.on('copy', copy)
    electron.ipcRenderer.on('paste', paste)
    electron.ipcRenderer.on('delete', deleteKey)

    // Setup Puppet
    layer = 'body'
    character = JSON.parse(JSON.stringify(project.characters[project.actor.id]))
    character.position = 1
    character.facingLeft = false
    character.emote = 'default'
    puppet = stage.addPuppet(character, 1)
    // I realize it's slightly redundant, but I want to update the editor panels
    //  while also adding the initial puppet so stage.setPuppet will work
    exports.setPuppet(character)
}

exports.addAsset = function(tab, asset) {
    var assetElement = document.createElement('div')
    document.getElementById('tab ' + tab).appendChild(assetElement)
    assetElement.id = project.assets[tab][asset].name.toLowerCase()
    assetElement.className = "asset " + asset
    assetElement.innerHTML = '<div class="desc">' + project.assets[tab][asset].name + '</div>'
    var assetDraggable = document.createElement('img')
    assetElement.appendChild(assetDraggable)
    assetDraggable.tab = tab
    assetDraggable.asset = asset
    assetDraggable.style.height = assetDraggable.style.width = '120px'
    assetDraggable.className = 'contain'
    assetDraggable.src = path.join(project.assetsPath, project.assets[tab][asset].location)
    assetDraggable.addEventListener('mousedown', mouseDown, false)
}

exports.migrateAsset = function(tab, asset, newTab) {
    fs.moveSync(path.join(project.assetsPath, project.assets[tab][asset].location), path.join(project.assetsPath, newTab, asset + '.png'))
    if (document.getElementById('asset-tab').tab === tab && document.getElementById('asset-tab').asset === asset) {
        document.getElementById('asset-tab').tab = document.getElementById('asset-tab').value = newTab
        document.getElementById('asset-name').tab = newTab
        document.getElementById('delete-asset').tab = newTab
    }
    document.getElementById('tab ' + newTab).appendChild(document.getElementById('tab ' + tab).getElementsByClassName(asset)[0])
    var topLevel = ["body", "head", "hat", "props"]
    for (var j = 0; j < topLevel.length; j++)
        for (var k = 0; k < character[topLevel[j]].length; k++)
            if (character[topLevel[j]][k].tab === tab && character[topLevel[j]][k].hash === asset)
                character[topLevel[j]][k].tab = newTab
    var emotes = Object.keys(character.emotes)
    for (var j = 0; j < emotes.length; j++) {
        for (var k = 0; k < character.emotes[emotes[j]].eyes.length; k++)
            if (character.emotes[emotes[j]].eyes[k].tab === tab && character.emotes[emotes[j]].eyes[k].hash === asset)
                character.emotes[emotes[j]].eyes[k].tab = newTab
        for (var k = 0; k < character.emotes[emotes[j]].mouth.length; k++)
            if (character.emotes[emotes[j]].mouth[k].tab === tab && character.emotes[emotes[j]].mouth[k].hash === asset)
                character.emotes[emotes[j]].mouth[k].tab = newTab
    }
}

exports.renameAssetList = function(tab, newTab) {
    document.getElementById('tab ' + tab).id = 'tab ' + newTab
    document.getElementById('tab option ' + tab).text = newTab
    document.getElementById('tab option ' + tab).id = 'tab option ' + newTab
    document.getElementById('asset-tab option ' + tab).text = newTab
    document.getElementById('asset-tab option ' + tab).id = 'asset-tab option ' + newTab
    document.getElementById('asset-list-name').tab = newTab
    document.getElementById('delete-asset-list').tab = newTab
    var topLevel = ["body", "head", "hat", "props"]
    for (var j = 0; j < topLevel.length; j++)
        for (var k = 0; k < character[topLevel[j]].length; k++)
            if (character[topLevel[j]][k].tab === tab)
                character[topLevel[j]][k].tab = newTab
    var emotes = Object.keys(character.emotes)
    for (var j = 0; j < emotes.length; j++) {
        for (var k = 0; k < character.emotes[emotes[j]].eyes.length; k++)
            if (character.emotes[emotes[j]].eyes[k].tab === tab)
                character.emotes[emotes[j]].eyes[k].tab = newTab
        for (var k = 0; k < character.emotes[emotes[j]].mouth.length; k++)
            if (character.emotes[emotes[j]].mouth[k].tab === tab)
                character.emotes[emotes[j]].mouth[k].tab = newTab
    }
}

exports.deleteAssetList = function(tab) {
    document.getElementById('asset list').removeChild(document.getElementById('tab ' + tab))
    document.getElementById('asset tabs').removeChild(document.getElementById('tab option ' + tab))
    document.getElementById('asset-tab').removeChild(document.getElementById('asset-tab option ' + tab))
    var assetKeys = Object.keys(project.assets)
    if (assetKeys[0])
        document.getElementById('tab ' + assetKeys[0]).style.display = ''
    document.getElementById('assets').style.display = ''
    document.getElementById('asset list editor').style.display = 'none'
}

exports.deleteAsset = function(tab, asset) {
    if (document.getElementById('delete-asset').tab === tab && document.getElementById('delete-asset').asset === asset) {
        selectAsset()
    }
    var element = document.getElementById('tab ' + tab).getElementsByClassName(asset)[0]
    element.parentNode.removeChild(element)
    var topLevel = ["body", "head", "hat", "props"]
    for (var j = 0; j < topLevel.length; j++)
        for (var k = 0; k < character[topLevel[j]].length; k++)
            if (character[topLevel[j]][k].tab === tab && character[topLevel[j]][k].hash === asset)
                character[topLevel[j]].splice(k, 1)
    var emotes = Object.keys(character.emotes)
    for (var j = 0; j < emotes.length; j++) {
        for (var k = 0; k < character.emotes[emotes[j]].eyes.length; k++) 
            if (character.emotes[emotes[j]].eyes[k].tab === tab && character.emotes[emotes[j]].eyes[k].hash === asset)
                character.emotes[emotes[j]].eyes.splice(k, 1)
        for (var k = 0; k < character.emotes[emotes[j]].mouth.length; k++)
            if (character.emotes[emotes[j]].mouth[k].tab === tab && character.emotes[emotes[j]].mouth[k].hash === asset)
                character.emotes[emotes[j]].mouth.splice(k, 1)
    }
    exports.setPuppet(character)
}

exports.setPuppet = function(newCharacter) {
    selected = null
    if (selectedGui) stage.stage.removeChild(selectedGui)
    clickableAssets = []

    character = newCharacter
    puppet = stage.createPuppet(character)
    stage.setPuppet(1, puppet)

    // Update Editor Panels
    var panel = document.getElementById('editor-layers-panel')
    var selected = panel.getElementsByClassName("selected")
    while (selected.length)
        selected[0].classList.remove("selected")
    var available = panel.getElementsByClassName("available")
    while (available.length)
        available[0].classList.remove("available")
    document.getElementById(layer).className += " selected"
    var emotes = panel.getElementsByClassName("emote")
    for (var i = 0; i < emotes.length; i++) {
        var emote = character.emotes[emotes[i].id.replace(/-emote/, '')]
        if (emote && emote.enabled)
            emotes[i].className += " available"
    }

    panel = document.getElementById('editor-babble-panel')
    available = panel.getElementsByClassName("available")
    while (available.length)
        available[0].classList.remove("available")
    emotes = document.getElementById('babble-mouths').getElementsByClassName("emote")
    for (var i = 0; i < emotes.length; i++) {
        var emote = emotes[i].id.replace(/-mouth/, '')
        if (character.mouths.indexOf(emote) > -1)
            emotes[i].className += " available"
    }
    emotes = document.getElementById('babble-eyes').getElementsByClassName("emote")
    for (var i = 0; i < emotes.length; i++) {
        var emote = emotes[i].id.replace(/-eyes/, '')
        if (character.eyes.indexOf(emote) > -1)
            emotes[i].className += " available"
    }

    document.getElementById('editor-name').value = character.name
    document.getElementById('deadbonesstyle').checked = character.deadbonesStyle
}

function drawBox(box) {
    box.lineStyle(4, 0x242a33)
    box.moveTo(stage.screen.clientWidth / 2 / scale - selected.width / 2 - 12, stage.screen.clientHeight / scale + selected.height / 2 + 12)
    box.lineTo(stage.screen.clientWidth / 2 / scale - selected.width / 2 - 12, stage.screen.clientHeight / scale - selected.height / 2 - 12)
    box.lineTo(stage.screen.clientWidth / 2 / scale + selected.width / 2 + 12, stage.screen.clientHeight / scale - selected.height / 2 - 12)
    box.lineTo(stage.screen.clientWidth / 2 / scale + selected.width / 2 + 12, stage.screen.clientHeight / scale + selected.height / 2 + 12)
    box.lineTo(stage.screen.clientWidth / 2 / scale - selected.width / 2 - 12, stage.screen.clientHeight / scale + selected.height / 2 + 12)
    box.lineStyle(2, 0x242a33, 0.5)
    box.drawCircle(stage.screen.clientWidth / 2 / scale + selected.width / 2 + 12, stage.screen.clientHeight / scale - selected.height / 2 - 12, 24)
}

function setSelected(asset) {
    selected = asset
    if (selectedGui) stage.stage.removeChild(selectedGui)
    selectedGui = new Container()
    var box = new Graphics()
    drawBox(box)
    selectedGui.addChild(box)
    selectedGui.box = box
    var corners = []
    for (var i = 0; i < 4; i++) {
        var graphics = new Graphics()
        graphics.lineStyle(2, 0x5464d4)
        graphics.beginFill(0x242a33)
        graphics.drawCircle(0, 0, 6)
        corners[i] = new Sprite(graphics.generateCanvasTexture(1))
        corners[i].x = stage.screen.clientWidth / 2 / scale - selected.width / 2 - 20 + (24 + selected.width) * (i % 2)
        corners[i].y = stage.screen.clientHeight / scale - selected.height / 2 - 20 + (24 + selected.height) * Math.floor(i / 2)
        selectedGui.addChild(corners[i])
        corners[i].i = i
        corners[i].interactive = true
        corners[i].on('mousedown', resizeMousedown)
    }
    selectedGui.corners = corners
    var rotate = new Sprite.fromImage(path.join('assets', 'icons', 'rotate.png'))
    rotate.pivot.x = rotate.pivot.y = 0.5
    rotate.width = rotate.height = 24
    rotate.interactive = true
    rotate.on('mousedown', rotateMousedown)
    rotate.x = corners[1].x + 12
    rotate.y = corners[1].y - 24
    selectedGui.addChild(rotate)
    selectedGui.rotate = rotate
    selectedGui.pivot.x = stage.screen.clientWidth / 2 / scale - selected.width / 2 - 12 + (24 + selected.width) * 0.5
    selectedGui.pivot.y = stage.screen.clientHeight / scale - selected.height / 2 - 12 + (24 + selected.height) * 0.5
    selectedGui.x = selected.x + selectedGui.pivot.x
    selectedGui.y = selected.y + selectedGui.pivot.y
    selectedGui.rotation = selected.rotation
    stage.stage.addChild(selectedGui)
}

function editorMousedown(e) {
    var closest = null
    var distance = -1
    for(var i = 0; i < clickableAssets.length; i++){
        var bounds = clickableAssets[i].getBounds();
        var centerX = bounds.x + bounds.width/2;
        var centerY = bounds.y + bounds.height/2;
        var dx = centerX - e.data.global.x;
        var dy = centerY - e.data.global.y;
        var dist = dx*dx + dy*dy; //Distance is not squared as it's not needed.
        if((dist < distance || distance == -1) && clickableAssets[i].visible && clickableAssets[i].containsPoint(e.data.global) && clickableAssets[i].layer === layer) {
            closest = clickableAssets[i];
            distance = dist;
        }
    }
    if (closest) {
        setSelected(closest)
        closest.dragging = true
        closest.start = {"x": e.data.getLocalPosition(closest.parent).x - selected.position.x, "y": e.data.getLocalPosition(closest.parent).y - selected.position.y}
        selectedGui.startX = e.data.global.x
        selectedGui.startY = e.data.global.y
    } else if (selected) {
        selected = null
        stage.stage.removeChild(selectedGui)
    }  
}

function editorMousemove(e) {
    if (selected && selected.dragging) {
        if (e.data.originalEvent.ctrlKey) {
            var rotation = Math.atan2(e.data.global.y - selectedGui.startY, e.data.global.x - selectedGui.startX)
            rotation = Math.round(rotation / ROUND_ROTATION) * ROUND_ROTATION
            var dist = Math.hypot(Math.cos(rotation) * (e.data.global.x - selectedGui.startX), Math.sin(rotation) * (e.data.global.y - selectedGui.startY)) / scale
            selected.x = selected.asset.x + Math.cos(rotation) * dist
            selected.y = selected.asset.y + Math.sin(rotation) * dist
            selectedGui.x = selected.x + selectedGui.pivot.x
            selectedGui.y = selected.y + selectedGui.pivot.y
        } else {
            var position = e.data.getLocalPosition(selected.parent)
            selected.x = position.x - selected.start.x
            selected.y = position.y - selected.start.y
            selectedGui.x = selected.x + selectedGui.pivot.x
            selectedGui.y = selected.y + selectedGui.pivot.y
        }
    }
}

function editorMouseup() {
    if (selected) {
        selected.dragging = false
        selected.asset.x = selected.x
        selected.asset.y = selected.y
    }
}

function resizeMousedown(e) {
    e.stopPropagation()
    selectedGui.dragging = true
    stage.stage.on('mousemove', resizeMousemove)
    stage.stage.on('mouseup', resizeMouseup)
    selectedGui.origWidth = selected.width
    selectedGui.origHeight = selected.height
    selectedGui.i = e.currentTarget.i
    var i = 1 - (selectedGui.i % 2) + 2 - 2 * Math.floor(selectedGui.i / 2)
    selectedGui.corner = {
        "x": selectedGui.corners[i].worldTransform.tx / scale - stage.screen.clientWidth / 2 / scale - (i % 2 == 1 ? 1 : -1) * Math.cos(selected.rotation - Math.PI / 4) * 17 - Math.sin(selected.rotation - Math.PI / 4) * 11,
        "y": selectedGui.corners[i].worldTransform.ty / scale - stage.screen.clientHeight / scale + (Math.floor(i / 2) == 1 ? 1 : -1) * Math.sin(selected.rotation - Math.PI / 4) * 17 + Math.cos(selected.rotation - Math.PI / 4) * 11
    }
    if (i === 0) {
        selectedGui.corner.x -= Math.sin(selected.rotation) * 24
        selectedGui.corner.y += Math.sin(selected.rotation) * 24
    } else if (i == 3) {
        selectedGui.corner.x += Math.sin(selected.rotation) * 24
        selectedGui.corner.y -= Math.sin(selected.rotation) * 24
    }
    selectedGui.startX = e.data.global.x
    selectedGui.startY = e.data.global.y
}

function resizeMousemove(e) {
    var dx, dy
    var rotation = Math.atan2(e.data.global.y - selectedGui.startY, e.data.global.x - selectedGui.startX)
    var dist = Math.hypot(e.data.global.x - selectedGui.startX, e.data.global.y - selectedGui.startY) / scale
    if (e.data.originalEvent.ctrlKey && selectedGui.origHeight !== 0) {
        dy = (Math.floor(selectedGui.i / 2) == 1 ? 1 : -1) * Math.sin(rotation - selected.rotation) * dist
        dx = (Math.max(0, selectedGui.origHeight + dy) - selectedGui.origHeight) * selectedGui.origWidth / selectedGui.origHeight
    } else {
        dx = (selectedGui.i % 2 == 1 ? 1 : -1) * Math.cos(rotation - selected.rotation) * dist
        dy = (Math.floor(selectedGui.i / 2) == 1 ? 1 : -1) * Math.sin(rotation - selected.rotation) * dist
    }

    if (e.data.originalEvent.shiftKey) {
        selected.width = Math.max(0, selectedGui.origWidth + 2 * dx)
        selected.height = Math.max(0, selectedGui.origHeight + 2 * dy)

        selected.x = selected.asset.x
        selected.y = selected.asset.y
    } else {
        selected.width = Math.max(0, selectedGui.origWidth + dx)
        selected.height = Math.max(0, selectedGui.origHeight + dy)

        selected.x = selectedGui.corner.x + (selectedGui.i % 2 == 1 ? 1 : -1) * Math.cos(selected.rotation) * selected.width / 2 - (Math.floor(selectedGui.i / 2) == 1 ? 1 : -1) * Math.sin(selected.rotation) * selected.height / 2
        selected.y = selectedGui.corner.y + (Math.floor(selectedGui.i / 2) == 1 ? 1 : -1) * Math.cos(selected.rotation) * selected.height / 2 + (selectedGui.i % 2 == 1 ? 1 : -1) * Math.sin(selected.rotation) * selected.width / 2
    }

    selectedGui.box.clear()
    drawBox(selectedGui.box)
    for (var i = 0; i < selectedGui.corners.length; i++) {
        selectedGui.corners[i].x = stage.screen.clientWidth / 2 / scale - selected.width / 2 - 20 + (24 + selected.width) * (i % 2)
        selectedGui.corners[i].y = stage.screen.clientHeight / scale - selected.height / 2 - 20 + (24 + selected.height) * Math.floor(i / 2)
    }
    selectedGui.rotate.x = selectedGui.corners[1].x + 12
    selectedGui.rotate.y = selectedGui.corners[1].y - 24
    selectedGui.pivot.x = stage.screen.clientWidth / 2 / scale - selected.width / 2 - 12 + (24 + selected.width) * 0.5
    selectedGui.pivot.y = stage.screen.clientHeight / scale - selected.height / 2 - 12 + (24 + selected.height) * 0.5
    selectedGui.x = selected.x + selectedGui.pivot.x
    selectedGui.y = selected.y + selectedGui.pivot.y
}

function resizeMouseup() {
    selectedGui.dragging = false
    stage.stage.off('mousemove', resizeMousemove)
    stage.stage.off('mouseup', resizeMouseup)
    selected.asset.scaleX /= selectedGui.origWidth / selected.width
    selected.asset.scaleY /= selectedGui.origHeight / selected.height
    selected.asset.x = selected.x
    selected.asset.y = selected.y
}

function rotateMousedown(e) {
    e.stopPropagation()
    selectedGui.dragging = true
    stage.stage.on('mousemove', rotateMousemove)
    stage.stage.on('mouseup', rotateMouseup)
    selectedGui.startRotation = Math.atan2((stage.screen.clientHeight - e.data.global.y) / scale + selected.asset.y, (e.data.global.x - stage.screen.clientWidth / 2) / scale - selected.asset.x) + selected.asset.rotation
}

function rotateMousemove(e) {
    var rotation = selectedGui.startRotation - Math.atan2((stage.screen.clientHeight - e.data.global.y) / scale + selected.asset.y, (e.data.global.x - stage.screen.clientWidth / 2) / scale - selected.asset.x)
    if (e.data.originalEvent.ctrlKey)
        rotation = Math.round(rotation / ROUND_ROTATION) * ROUND_ROTATION
    selected.rotation = rotation
    selectedGui.rotation = rotation
}

function rotateMouseup() {
    selectedGui.dragging = false
    stage.stage.off('mousemove', rotateMousemove)
    stage.stage.off('mouseup', rotateMouseup)
    selected.asset.rotation = selected.rotation
}

function mouseUp(e) {
    if (asset) {
        if (asset.dragging || asset.clicked) {
            var rect = document.getElementById('editor-screen').getBoundingClientRect()
            if (rect.left < e.clientX && rect.right > e.clientX && rect.top < e.clientY && rect.bottom > e.clientY) {
                selected = null
                if (selectedGui) stage.stage.removeChild(selectedGui)
                var newAsset = {
                    "tab": asset.tab,
                    "hash": asset.asset,
                    "x": (e.clientX - rect.left - rect.width / 2) / scale,
                    "y": (e.clientY - rect.bottom) / scale,
                    "rotation": 0,
                    "scaleX": 1,
                    "scaleY": 1
                }
                if (layer.indexOf('-emote') > -1) {
                    if (!puppet.emotes[layer.replace(/-emote/, '')])
                        puppet.addEmote(layer.replace(/-emote/, ''))
                    if (document.getElementById('eyemouth').checked) {
                        puppet.emotes[layer.replace(/-emote/, '')].eyes.addChild(stage.getAsset(newAsset, layer))
                        character.emotes[layer.replace(/-emote/, '')].eyes.push(newAsset)
                    } else {
                        puppet.emotes[layer.replace(/-emote/, '')].mouth.addChild(stage.getAsset(newAsset, layer))
                        character.emotes[layer.replace(/-emote/, '')].mouth.push(newAsset)
                    }
                } else {
                    puppet[layer].addChild(stage.getAsset(newAsset, layer))
                    character[layer === 'headBase' ? 'head' : layer].push(newAsset)
                }
            } 
            if (!e.shiftKey) {
                window.removeEventListener('mousemove', moveAsset, true);
                asset.style.position = 'static'
                asset.style.cursor = ''
                asset.style.top = asset.style.left = ""
                asset.style.width = asset.style.height = 120 + "px"
                asset.style.zIndex = ''
                asset = null
            }
        } else asset.clicked = true
    }
}

function mouseDown(e) {
    if (asset) return
    if (e.button === 0) {
        asset = e.target
        asset.dragging = asset.clicked = false
        asset.style.zIndex = '2'
        asset.style.position = 'fixed'
        asset.style.cursor = 'none'
        asset.style.width = asset.style.height = 'unset'
        asset.style.width = asset.width * scale + "px"
        asset.style.top = (e.clientY - asset.height / 2) + 'px'
        asset.style.left = (e.clientX - asset.width / 2) + 'px'
        e.preventDefault()
        window.addEventListener('mousemove', moveAsset, true);
    } else {
        document.getElementById('assets').style.display = 'none'
        document.getElementById('asset editor').style.display = ''
        document.getElementById('asset selected').getElementsByClassName('desc')[0].innerHTML = project.assets[e.target.tab][e.target.asset].name
        document.getElementById('asset selected').getElementsByTagName('img')[0].src = path.join(project.assetsPath, project.assets[e.target.tab][e.target.asset].location)
        document.getElementById('asset-tab').value = e.target.tab
        document.getElementById('asset-name').value = project.assets[e.target.tab][e.target.asset].name
        document.getElementById('asset-tab').tab = e.target.tab
        document.getElementById('asset-tab').asset = e.target.asset
        document.getElementById('asset-name').tab = e.target.tab
        document.getElementById('asset-name').asset = e.target.asset
        document.getElementById('delete-asset').tab = e.target.tab
        document.getElementById('delete-asset').asset = e.target.asset
    }
}

function moveAsset(e) {
    asset.dragging = true
    asset.style.top = (e.clientY - asset.height / 2) + 'px'
    asset.style.left = (e.clientX - asset.width / 2) + 'px'
}

function savePuppet() {
    status.log('Saving puppet...')
    selected = null
    if (selectedGui) stage.stage.removeChild(selectedGui)
    stage.renderer.render(stage.stage)
    controller.saveCharacter(character, stage.renderer.view.toDataURL().replace(/^data:image\/\w+;base64,/, ""))
    status.log('Puppet saved!')
}

function newPuppet() {
    exports.setPuppet(JSON.parse(project.getEmptyCharacter()))
}

function dupePuppet() {
    exports.setPuppet(JSON.parse(project.duplicateCharacter(character)))
}

function importPuppet() {
    remote.dialog.showOpenDialog(remote.BrowserWindow.getFocusedWindow(), {
        title: 'Import Character',
        filters: [
            {name: 'JSON Files', extensions: ['json']},
            {name: 'All Files', extensions: ['*']}
        ],
        properties: [
            'openFile'
        ] 
    }, (filepaths) => {
        if (filepaths)
            fs.readJson(filepaths[0], (err, character) => {
                if (err) console.log(err)
                else exports.setPuppet(JSON.parse(project.duplicateCharacter(character)))
            })
    })
}

function openPuppet(e) {
    document.getElementById('editor-screen').style.display = ''
    document.getElementById('editor-open-panel').style.display = 'none'
    exports.setPuppet(JSON.parse(JSON.stringify(project.characters[e.target.charid])))
}

function updateCharSearch(e) {
    var list = document.getElementById('char open list')
    if (e.target.value === '') {
        for (var i = 0; i < list.children.length; i++)
            list.children[i].style.display = 'inline-block'
    } else {
        for (var i = 0; i < list.children.length; i++)
            list.children[i].style.display = 'none'
        var chars = list.querySelectorAll("[id*='" + e.target.value.toLowerCase() + "']")
        for (var i = 0; i < chars.length; i++) {
            chars[i].style.display = 'inline-block'
        }
    }
}

function openPuppetPanel() {
    document.getElementById('editor-layers-panel').style.display = 'none'
    document.getElementById('editor-babble-panel').style.display = 'none'
    document.getElementById('editor-settings-panel').style.display = 'none'
    var panel = document.getElementById('editor-open-panel')
    if (panel.style.display === 'none') {
        document.getElementById('editor-screen').style.display = 'none'
        panel.style.display = ''
        var charList = document.getElementById('char open list')
        charList.innerHTML = ''
        var characters = Object.keys(project.characters)
        for (var j = 0; j < characters.length; j++) {
            var selector = document.createElement('div')
            selector.id = project.characters[characters[j]].name.toLowerCase()
            selector.className = "char"
            selector.style.backgroundImage = 'url(' + path.join(project.assetsPath, '..', 'thumbnails', characters[j] + '.png?random=' + new Date().getTime()) + ')'
            charList.appendChild(selector)
            selector.innerHTML = '<div class="desc">' + project.characters[characters[j]].name + '</div>'
            selector.charid = characters[j]
            selector.addEventListener('click', openPuppet)
        }
    } else {
        document.getElementById('editor-screen').style.display = ''
        panel.style.display = 'none'
    }
}

function toggleLayers() {
    document.getElementById('editor-open-panel').style.display = 'none'
    document.getElementById('editor-babble-panel').style.display = 'none'
    document.getElementById('editor-settings-panel').style.display = 'none'
    var panel = document.getElementById('editor-layers-panel')
    if (panel.style.display === 'none') {
        document.getElementById('editor-screen').style.display = 'none'
        panel.style.display = ''
    } else {
        document.getElementById('editor-screen').style.display = ''
        panel.style.display = 'none'
    }
}

function toggleBabble() {
    document.getElementById('editor-open-panel').style.display = 'none'
    document.getElementById('editor-layers-panel').style.display = 'none'
    document.getElementById('editor-settings-panel').style.display = 'none'
    var panel = document.getElementById('editor-babble-panel')
    if (panel.style.display === 'none') {
        document.getElementById('editor-screen').style.display = 'none'
        panel.style.display = ''
    } else {
        document.getElementById('editor-screen').style.display = ''
        panel.style.display = 'none'
    }
}

function toggleSettings() {
    document.getElementById('editor-open-panel').style.display = 'none'
    document.getElementById('editor-layers-panel').style.display = 'none'
    document.getElementById('editor-babble-panel').style.display = 'none'
    var panel = document.getElementById('editor-settings-panel')
    if (panel.style.display === 'none') {
        document.getElementById('editor-screen').style.display = 'none'
        panel.style.display = ''
    } else {
        document.getElementById('editor-screen').style.display = ''
        panel.style.display = 'none'
    }
}

function setLayer(e) {
    document.getElementById('editor-screen').style.display = ''
    document.getElementById('editor-layers-panel').style.display = 'none'
    layer = e.target.id
    if (layer.indexOf('-emote') > -1) {
        puppet.changeEmote(layer.replace(/-emote/, ''))
    }
    var selected = document.getElementById('editor-layers-panel').getElementsByClassName("selected")
    while (selected.length)
        selected[0].classList.remove("selected")
    document.getElementById(layer).className += " selected"
    selected = null
    if (selectedGui) stage.stage.removeChild(selectedGui)
}

function layerContextMenu(e) {
    var emote = e.target.id.replace(/-emote/, '')
    if (character.emotes[emote] && character.emotes[emote].enabled && emote !== 'default') {
        character.emotes[emote].enabled = false
        e.target.classList.remove('available')
    } else {
        if (character.emotes[emote])
            character.emotes[emote].enabled = true
        else
            character.emotes[emote] = {
                "enabled": true,
                "mouth": [],
                "eyes": []
            }
        e.target.className += " available"
    }
}

function mouthLayerClick(e) {
    var emote = e.target.id.replace(/-mouth/, '')
    if (character.mouths.indexOf(emote) > -1) {
        character.mouths.splice(character.mouths.indexOf(emote), 1)
        e.target.classList.remove('available')
    } else {
        character.mouths.push(emote)
        e.target.className += ' available'
    }
}

function eyesLayerClick(e) {
    var emote = e.target.id.replace(/-eyes/, '')
    if (character.eyes.indexOf(emote) > -1) {
        character.eyes.splice(character.eyes.indexOf(emote), 1)
        e.target.classList.remove('available')
    } else {
        character.eyes.push(emote)
        e.target.className += ' available'
    }
}

function nameChange(e) {
    character.name = e.target.value
}

function bobbleChange(e) {
    character.deadbonesStyle = e.target.checked
}

function deleteCharacter() {
    if (character.id == project.actor.id) {
        status.error("You can't delete your active character. Please switch characters and try again.")
        return
    }
    project.deleteCharacter(character)
    controller.deleteCharacter(character)
    document.getElementById('editor-screen').style.display = ''
    document.getElementById('editor-settings-panel').style.display = 'none'
    exports.setPuppet(project.characters[project.actor.id])
}

function addAsset() {
    remote.dialog.showOpenDialog(remote.BrowserWindow.getFocusedWindow(), {
        title: 'Add Assets',
        filters: [
          {name: 'Image', extensions: ['png']}
        ],
        properties: [
          'openFile',
          'multiSelections'
        ] 
    }, (filepaths) => {
        if (!filepaths) return
        for (var i = 0; i < filepaths.length; i++) {
            var file = fs.readFileSync(filepaths[i])
            var name = filepaths[i].replace(/^.*[\\\/]/, '').replace(/.png/, '')
            var fileString = file.toString('base64')
            var hash = 0, char, j, l
            for (j = 0, l = fileString.length; j < l; j++) {
                char  = fileString.charCodeAt(j)
                hash  = ((hash<<5)-hash)+char
                hash |= 0
            }
            hash = "" + hash
            var tab = document.getElementById('asset tabs').value
            fs.ensureDirSync(path.join(project.assetsPath, tab))
            fs.writeFileSync(path.join(project.assetsPath, tab, hash + '.png'), file)
            controller.addAsset({"tab": tab, "hash": hash, "name": name})
        }
    })
}

function editAssetList() {
    if (Object.keys(project.assets).length === 0) return
    document.getElementById('assets').style.display = 'none'
    document.getElementById('asset list editor').style.display = ''
    document.getElementById('asset-list-name').value = document.getElementById('asset tabs').value
    document.getElementById('asset-list-name').tab = document.getElementById('asset tabs').value
    document.getElementById('delete-asset-list').tab = document.getElementById('asset tabs').value
}

function closeAssetListEditor() {
    document.getElementById('assets').style.display = ''
    document.getElementById('asset list editor').style.display = 'none'
}

function renameAssetList(e) {
    controller.renameAssetList(e.target.tab, e.target.value)
}

function deleteAssetList(e) {
    controller.deleteAssetList(e.target.tab)
}

function newAssetList() {
    // Calculate name for new asset list
    var name = "New Asset List", i = 0
    while (project.assets[name])
        name = "New Asset List (" + (++i) + ")"
    // Create list
    project.addAssetList(name)
    // Add list to DOM
    addAssetListToDom(name)
    // Select new list
    document.getElementById('asset tabs').value = name
    var assetKeys = Object.keys(project.assets)
    for (var i = 0; i < assetKeys.length; i++)
        document.getElementById('tab ' + assetKeys[i]).style.display = 'none'
    document.getElementById('tab ' + name).style.display = ''
}

function importAssetList() {
    remote.dialog.showOpenDialog(remote.BrowserWindow.getFocusedWindow(), {
        title: 'Import Asset List',
        filters: [
            {name: 'JSON Files', extensions: ['json']},
            {name: 'All Files', extensions: ['*']}
        ],
        properties: [
            'openFile'
        ] 
    }, (filepaths) => {
        if (filepaths)
            fs.readJson(filepaths[0], (err, list) => {
                if (err) console.log(err)
                else {
                    var listKeys = Object.keys(list)
                    var tab = filepaths[0].replace(/^.*[\\\/]/, '').replace(/\.[^.]+$/, '')
                    if (!project.assets[tab]) addAssetListToDom(tab)
                    for (var i = 0; i < listKeys.length; i++) {
                        status.log('Importing ' + (listKeys.length - i) + ' assets...')
                        if (project.assets[tab] && project.assets[tab][listKeys[i]]) continue
                        fs.copySync(path.join(filepaths[0], '..', list[listKeys[i]].location), path.join(project.assetsPath, tab, listKeys[i] + '.png'))
                        controller.addAsset({"tab": tab, "hash": listKeys[i], "name": list[listKeys[i]].name})
                    }
                    status.log('Imported ' + listKeys.length + ' assets!')
                }
            })
    })
}

function addAssetListToDom(name) {
    var tabElement = document.createElement('div')
    tabElement.style.height = '100%'
    tabElement.id = 'tab ' + name
    tabElement.className = 'scroll'
    document.getElementById('asset list').appendChild(tabElement)
    var tabOption = document.createElement('option')
    tabOption.text = name
    tabOption.id = "asset-tab option " + name
    document.getElementById('asset-tab').add(tabOption)
    tabOption = document.createElement('option')
    tabOption.text = name
    tabOption.id = "tab option " + name
    document.getElementById('asset tabs').add(tabOption)
}

function selectAsset() {
    document.getElementById('assets').style.display = ''
    document.getElementById('asset editor').style.display = 'none'
}

function migrateAsset(e) {
    controller.moveAsset(e.target.tab, e.target.asset, e.target.value)
    e.target.tab = e.target.value
}

function renameAsset(e) {
    project.renameAsset(e.target.tab, e.target.asset, e.target.value)
    document.getElementById('asset selected').getElementsByClassName('desc')[0].innerHTML = e.target.value
    var list = document.getElementById('tab ' + e.target.tab)
    list.getElementsByClassName(e.target.asset)[0].getElementsByClassName('desc')[0].innerHTML = e.target.value
    list.getElementsByClassName(e.target.asset)[0].id = e.target.value.toLowerCase()
}

function deleteAsset(e) {
    controller.deleteAsset(e.target.tab, e.target.asset)
}

function assetTabs(e) {
    var assetKeys = Object.keys(project.assets)
    for (var i = 0; i < assetKeys.length; i++)
        document.getElementById('tab ' + assetKeys[i]).style.display = 'none'
    document.getElementById('tab ' + e.target.value).style.display = ''
}

function updateAssetSearch(e) {
    var assetKeys = Object.keys(project.assets)
    for (var i = 0; i < assetKeys.length; i++) {
        var list = document.getElementById('tab ' + assetKeys[i])
        if (e.target.value === '') {
            for (var j = 0; j < list.children.length; j++)
                list.children[j].style.display = ''
        } else {
            for (var j = 0; j < list.children.length; j++)
                list.children[j].style.display = 'none'
            var assetsElements = list.querySelectorAll("[id*='" + e.target.value.toLowerCase() + "']")
            for (var j = 0; j < assetsElements.length; j++) {
                assetsElements[j].style.display = ''
            }
        }
    }
}

function zoomIn() {
    scale *= 2
    stage.resize()
}

function zoomOut() {
    scale /= 2
    stage.resize()
}

function cut() {
    if (selected) {
        electron.clipboard.writeText(JSON.stringify(selected.asset))
        puppet[layer].removeChild(selected)
        character[layer === 'headBase' ? 'head' : layer].splice(character[layer === 'headBase' ? 'head' : layer].indexOf(selected.asset), 1)
        selected = null
        stage.stage.removeChild(selectedGui)
    }
}

function copy() {
    if (selected) electron.clipboard.writeText(JSON.stringify(selected.asset))
}

function paste() {
    var newAsset
    try {
        newAsset = JSON.parse(electron.clipboard.readText())
    } catch (e) {
        return
    }
    var asset = stage.getAsset(newAsset, layer)
    if (layer.indexOf('-emote') > -1) {
        if (document.getElementById('eyemouth').checked) {
            puppet.emotes[layer.replace(/-emote/, '')].eyes.addChild(asset)
            character.emotes[layer.replace(/-emote/, '')].eyes.push(newAsset)
        } else {
            puppet.emotes[layer.replace(/-emote/, '')].mouth.addChild(asset)
            character.emotes[layer.replace(/-emote/, '')].mouth.push(newAsset)
        }
    } else {
        puppet[layer].addChild(asset)
        character[layer === 'headBase' ? 'head' : layer].push(newAsset)
    }
    setSelected(asset)
}

function deleteKey() {
    if (selected) {
        if (layer.indexOf('-emote') > -1) {
            if (document.getElementById('eyemouth').checked) {
                puppet.emotes[layer.replace(/-emote/, '')].eyes.removeChild(selected)
                character.emotes[layer.replace(/-emote/, '')].eyes.splice(character.emotes[layer.replace(/-emote/, '')].eyes.indexOf(selected.asset), 1)
            } else {
                puppet.emotes[layer.replace(/-emote/, '')].mouth.removeChild(selected)
                character.emotes[layer.replace(/-emote/, '')].mouth.splice(character.emotes[layer.replace(/-emote/, '')].mouth.indexOf(selected.asset), 1)
            }
        } else {
            puppet[layer].removeChild(selected)
            character[layer === 'headBase' ? 'head' : layer].splice(character[layer === 'headBase' ? 'head' : layer].indexOf(selected.asset), 1)
        }
        selected = null
        stage.stage.removeChild(selectedGui)
    }
}
