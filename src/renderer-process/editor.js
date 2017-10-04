// Imports
const electron = require('electron')
const remote = electron.remote
const sizeOf = require('image-size')
const PIXI = require('pixi.js')
const path = require('path')
const controller = require('./controller.js')
const settings = remote.require('./main-process/settings')
const status = require('./status.js')
const babble = require('babble.js')
const fs = require('fs-extra')
const gifuct = require('./../lib/gifuct-js')

// Aliases
let BaseTextureCache = PIXI.utils.BaseTextureCache,
    Container = PIXI.Container,
    Sprite = PIXI.Sprite,
    Texture = PIXI.Texture,
    TextureCache = PIXI.utils.TextureCache,
    Rectangle = PIXI.Rectangle,
    Graphics = PIXI.Graphics

// Constants
const ROUND_ROTATION = Math.PI / 4 // When rounding angles, this is the step size to use

// Vars
let project
let stage // Stage instance
let asset // asset being moved (outside of pixi)
let assetTabs = [] // list of asset tabs
let scale = 1 // scale of the editor view
let puppet // puppet being edited
let character // character being edited
let oldcharacter // currently saved version of character
let layer // layer being edited
let clickableAssets = [] // assets in editor that are clickable
let selected // selected asset inside of pixi
let selectedGui // gui that appears around selected
let history = [] // used for undoing stuff
let reverseHistory = [] // used for redoing stuff
let importing  // used for importing assets from other projects
let alwaysDifferent // If this is a new puppet, it should always be considered different from its initial value
let networking = false // whether or not we're currently using online features. Disables deleting downloaded assets while true

exports.init = function() {
    project = remote.getGlobal('project').project
    // Create some basic objects
    stage = new babble.Stage('editor-screen', {'numCharacters': 1, 'puppetScale': 1, 'assets': project.project.assets}, project.assets, project.assetsPath, null, status)
    window.addEventListener("resize", () => {stage.resize()})
    stage.stage.interactive = true
    stage.stage.on('mousedown', editorMousedown)
    stage.stage.on('mousemove', editorMousemove)
    window.addEventListener('mouseup', mouseUp, false)

    // Override some parts of the stage
    stage.resize = function() {
        this.renderer.resize(this.screen.clientWidth, this.screen.clientHeight)
        this.slotWidth = this.screen.clientWidth / this.project.numCharacters
        this.puppetStage.scale.x = this.puppetStage.scale.y = scale
        puppet.container.y = this.screen.clientHeight / scale
        puppet.container.x = (this.screen.clientWidth / scale) / 2
        selected = null
        if (selectedGui) this.stage.removeChild(selectedGui)
    }
    stage.getAsset = function(asset, layer, emote) {
        let sprite
        if (this.assets[asset.id]) {
            let assetData = this.assets[asset.id]
            if (assetData.type === "animated") {
                let base = BaseTextureCache[path.join(this.assetsPath, assetData.location)]
                let textures = []
                let width = base.width / assetData.cols
                let height = base.height / assetData.rows
                for (let i = 0; i < assetData.numFrames; i++) {
                    if ((i % assetData.cols) * width + width > base.width || Math.floor(i / assetData.cols) * height + height > base.height) continue
                    let rect = new Rectangle((i % assetData.cols) * width, Math.floor(i / assetData.cols) * height, width, height)
                    textures.push(new Texture(base, rect))
                }
                sprite = new PIXI.extras.AnimatedSprite(textures)
                sprite.animationSpeed = 20 / assetData.delay
                sprite.play()
            } else sprite = new Sprite(TextureCache[path.join(this.assetsPath, assetData.location)])
        } else {
            sprite = new Sprite()
            if (this.log) this.log("Unable to load asset \"" + asset.id + "\"", 5, 2)
        }
        sprite.anchor.set(0.5)
        sprite.x = asset.x
        sprite.y = asset.y
        sprite.rotation = asset.rotation
        sprite.scale.x = asset.scaleX
        sprite.scale.y = asset.scaleY
        sprite.asset = asset
        sprite.layer = layer
        sprite.emote = emote
        clickableAssets.push(sprite)
        return sprite
    }

    // Make mousedown work on entire stage
    let backdrop = new PIXI.Container();
    backdrop.interactive = true;
    backdrop.containsPoint = () => true;
    stage.stage.addChild(backdrop)

    // Update Editor
    let tabs = document.getElementById('asset list')
    let tabsList = document.getElementById('asset tabs')
    let keys = Object.keys(project.assets)
    assetTabs = []
    for (let i = 0; i < keys.length; i++) {
        if (assetTabs.indexOf(project.assets[keys[i]].tab) === -1) {
            assetTabs.push(project.assets[keys[i]].tab)
        }
    }
    for (let i = 0; i < assetTabs.length; i++) {
        let tabElement = document.createElement('div')
        let tabOption = document.createElement('option')
        tabOption.text = assetTabs[i]
        tabOption.id = "tab option " + assetTabs[i]
        tabsList.add(tabOption)
        tabs.appendChild(tabElement)
        tabElement.style.display = 'none'
        tabElement.style.height = '100%'
        tabElement.id = 'tab ' + assetTabs[i]
        tabElement.className = 'scroll'
    }
    for (let i = 0; i < keys.length; i++) {
        exports.addAsset(keys[i], project.assets[keys[i]])
    }
    if (assetTabs[0])
        document.getElementById('tab ' + assetTabs[0]).style.display = ''
    exports.reloadPuppetList()

    // DOM listeners
    document.getElementById('editor-save').addEventListener('click', savePuppet)
    document.getElementById('editor-new').addEventListener('click', newPuppet)
    document.getElementById('editor-duplicate').addEventListener('click', dupePuppet)
    document.getElementById('editor-import').addEventListener('click', importPuppet)
    document.getElementById('editor-open').addEventListener('click', openPuppetPanel)
    document.getElementById('char open search').addEventListener('keyup', updateCharSearch)
    document.getElementById('char open search').addEventListener('search', updateCharSearch)
    document.getElementById('editor-emote').addEventListener('change', selectEmote)
    let buttons = document.getElementById('editor-layers').getElementsByTagName('button')
    for (let i = 0; i < buttons.length; i++)
        buttons[i].addEventListener('click', setLayer)
    document.getElementById('editor-emotes').addEventListener('click', toggleEmotes)
    for (let i = 0; i < 12; i++) {
        document.getElementById('emote-' + (i + 1)).addEventListener('click', openEmote)
    }
    document.getElementById('emote-name').addEventListener('change', changeEmoteName)
    document.getElementById('emote-enabled').addEventListener('change', toggleEmoteEnabled)
    document.getElementById('emote-mouth').addEventListener('change', toggleBabbleMouth)
    document.getElementById('emote-eyes').addEventListener('change', toggleBabbleEyes)
    document.getElementById('editor-settings').addEventListener('click', toggleSettings)
    document.getElementById('editor-name').addEventListener('change', nameChange)
    document.getElementById('deadbonesstyle').addEventListener('click', bobbleChange)
    document.getElementById('eyeBabbleDuration').addEventListener('change', eyeDurationChange)
    document.getElementById('mouthBabbleDuration').addEventListener('change', mouthDurationChange)
    document.getElementById('delete-character').addEventListener('click', deleteCharacter)
    document.getElementById('add-asset').addEventListener('click', addAsset)
    document.getElementById('add-animated-asset').addEventListener('click', addAnimatedAsset)
    document.getElementById('import-asset').addEventListener('click', importAssets)
    document.getElementById('import-all').addEventListener('click', toggleImportAll)
    document.getElementById('cancel-import-assets').addEventListener('click', controller.openModal)
    document.getElementById('import-assets-btn').addEventListener('click', confirmImportAssets)
    document.getElementById('import-all-puppets').addEventListener('click', toggleImportAllPuppets)
    document.getElementById('cancel-import-puppets').addEventListener('click', controller.openModal)
    document.getElementById('import-puppets-btn').addEventListener('click', confirmImportPuppets)
    document.getElementById('new-asset-bundle').addEventListener('click', () => {
        status.log('Not Yet Implemented!', 1, 1)
    })
    document.getElementById('edit-asset-list').addEventListener('click', editAssetList)
    document.getElementById('asset-list-name').addEventListener('change', renameAssetList)
    document.getElementById('delete-asset-list').addEventListener('click', deleteAssetList)
    document.getElementById('new-asset-list').addEventListener('click', newAssetList)
    document.getElementById('asset selected').addEventListener('click', selectAsset)
    for (let i = 0; i < assetTabs.length; i++) {
        let tabOption = document.createElement('option')
        tabOption.text = assetTabs[i]
        tabOption.id = 'asset-tab option ' + assetTabs[i]
        document.getElementById('asset-tab').add(tabOption)
    }
    document.getElementById('asset-tab').addEventListener('change', migrateAsset)
    document.getElementById('asset-name').addEventListener('change', renameAsset)
    document.getElementById('asset-type').addEventListener('change', assetType)
    document.getElementById('animation-rows').addEventListener('change', animationRows)
    document.getElementById('animation-cols').addEventListener('change', animationCols)
    document.getElementById('animation-numFrames').addEventListener('change', animationFrames)
    document.getElementById('animation-delay').addEventListener('change', animationDelay)
    document.getElementById('duplicate-asset').addEventListener('click', duplicateAsset)
    document.getElementById('replace-asset').addEventListener('click', replaceAsset)
    document.getElementById('delete-asset').addEventListener('click', deleteAsset)
    document.getElementById('asset tabs').addEventListener('change', changeAssetTabs)
    document.getElementById('asset search').addEventListener('keyup', updateAssetSearch)
    document.getElementById('asset search').addEventListener('search', updateAssetSearch)
    document.getElementById('zoom in').addEventListener('click', zoomIn)
    document.getElementById('zoom out').addEventListener('click', zoomOut)
    document.body.addEventListener('click', deselect)

    // Receive messages from application menu
    electron.ipcRenderer.on('cut', cut)
    electron.ipcRenderer.on('copy', copy)
    electron.ipcRenderer.on('paste', paste)
    electron.ipcRenderer.on('delete', deleteKey)
    electron.ipcRenderer.on('undo', undo)
    electron.ipcRenderer.on('redo', redo)

    // Setup Puppet
    layer = 'body'
    character = JSON.parse(JSON.stringify(project.characters[project.actor.id]))
    character.position = 1
    character.facingLeft = false
    character.emote = 0
    puppet = stage.addPuppet(character, 1)
    // I realize it's slightly redundant, but I want to update the editor panels
    //  while also adding the initial puppet so stage.setPuppet will work
    exports.setPuppet(character, true)
}

exports.addAsset = function(id) {
    let asset = project.assets[id]
    let assetElement = document.createElement('div')
    if (!document.getElementById('tab ' + asset.tab)) addAssetListToDom(asset.tab)
    document.getElementById('tab ' + asset.tab).appendChild(assetElement)
    assetElement.id = asset.name.toLowerCase()
    assetElement.className = "asset " + id
    assetElement.innerHTML = '<div class="desc">' + asset.name + '</div>'
    let assetDraggable = document.createElement('img')
    assetElement.appendChild(assetDraggable)
    assetDraggable.asset = id
    assetDraggable.style.height = assetDraggable.style.width = '120px'
    assetDraggable.className = 'contain'
    if (asset.type === "animated") {
        let location = asset.location
        location = [location.slice(0, location.length - 4), '.thumb', location.slice(location.length - 4)].join('')
        assetDraggable.src = path.join(project.assetsPath, location + "?random=" + new Date().getTime())
        assetElement.className += ' animated'
    } else 
        assetDraggable.src = path.join(project.assetsPath, asset.location + "?random=" + new Date().getTime())
    if (id.split(':')[0] !== settings.settings.uuid) {
        assetElement.className += ' downloaded'
    }
    assetDraggable.addEventListener('mousedown', mouseDown, false)
}

exports.migrateAsset = function(id, newTab) {
    let asset = project.assets[id]
    if (document.getElementById('asset-tab').asset === id) {
        document.getElementById('asset-tab').value = newTab
    }
    document.getElementById('tab ' + newTab).appendChild(document.getElementById('tab ' + asset.tab).getElementsByClassName(id)[0])
}

exports.reloadAssets = function() {
    // Update Assets
    let tabs = document.getElementById('asset list')
    let tabsList = document.getElementById('asset tabs')
    let keys = Object.keys(project.assets)
    assetTabs = []
    for (let i = 0; i < keys.length; i++) {
        if (assetTabs.indexOf(project.assets[keys[i]].tab) === -1) {
            assetTabs.push(project.assets[keys[i]].tab)
        }
    }
    for (let i = 0; i < assetTabs.length; i++) {
        let tabElement = document.createElement('div')
        let tabOption = document.createElement('option')
        tabOption.text = assetTabs[i]
        tabOption.id = "tab option " + assetTabs[i]
        tabsList.add(tabOption)
        tabs.appendChild(tabElement)
        tabElement.style.display = 'none'
        tabElement.style.height = '100%'
        tabElement.id = 'tab ' + assetTabs[i]
        tabElement.className = 'scroll'
    }
    for (let i = 0; i < keys.length; i++) {
        exports.addAsset(keys[i], project.assets[keys[i]])
    }
    if (assetTabs[0])
        document.getElementById('tab ' + assetTabs[0]).style.display = ''

    // Update Puppet
    exports.setPuppet(JSON.parse(JSON.stringify(project.characters[character.id])), true)
    savePuppet()
}

exports.renameAssetList = function(tab, newTab) {
    document.getElementById('tab ' + tab).id = 'tab ' + newTab
    document.getElementById('tab option ' + tab).text = newTab
    document.getElementById('tab option ' + tab).id = 'tab option ' + newTab
    document.getElementById('asset-tab option ' + tab).text = newTab
    document.getElementById('asset-tab option ' + tab).id = 'asset-tab option ' + newTab
    document.getElementById('asset-list-name').tab = newTab
    document.getElementById('delete-asset-list').tab = newTab
    assetTabs[assetTabs.indexOf(tab)] = newTab
}

exports.deleteAssetList = function(tab) {
    document.getElementById('asset list').removeChild(document.getElementById('tab ' + tab))
    document.getElementById('asset tabs').removeChild(document.getElementById('tab option ' + tab))
    document.getElementById('asset-tab').removeChild(document.getElementById('asset-tab option ' + tab))
    assetTabs.splice(assetTabs.indexOf(tab), 1)
    if (assetTabs[0])
        document.getElementById('tab ' + assetTabs[0]).style.display = ''
    document.getElementById('assets').style.display = ''
    document.getElementById('asset list editor').style.display = 'none'
}

exports.deleteAsset = function(id) {
    let asset = project.assets[id]
    if (document.getElementById('delete-asset').asset === id) {
        selectAsset()
    }
    let element = document.getElementById('tab ' + asset.tab).getElementsByClassName(id)[0]
    element.parentNode.removeChild(element)
    let topLevel = ["body", "head", "hat", "props"]
    for (let j = 0; j < topLevel.length; j++)
        for (let k = 0; k < character[topLevel[j]].length; k++)
            if (character[topLevel[j]][k].id === id)
                character[topLevel[j]].splice(k, 1)
    let emotes = Object.keys(character.emotes)
    for (let j = 0; j < emotes.length; j++) {
        for (let k = 0; k < character.emotes[emotes[j]].eyes.length; k++) 
            if (character.emotes[emotes[j]].eyes[k].id === id)
                character.emotes[emotes[j]].eyes.splice(k, 1)
        for (let k = 0; k < character.emotes[emotes[j]].mouth.length; k++)
            if (character.emotes[emotes[j]].mouth[k].id === id)
                character.emotes[emotes[j]].mouth.splice(k, 1)
    }
    exports.setPuppet(character, true)
}

exports.updateAsset = function(id) {
    stage.updateAsset(id)
}

exports.reloadAsset = function(id) {
    let asset = project.assets[id]
    let assetElement = document.getElementById('tab ' + asset.tab).getElementsByClassName(id)[0]
    assetElement.className = 'asset ' + id
    assetElement.id = asset.name.toLowerCase()
    assetElement.childNodes[0].innerHTML = asset.name
    let assetDraggable = assetElement.childNodes[1]
    if (asset.type === "animated") {
        let location = asset.location
        location = [location.slice(0, location.length - 4), '.thumb', location.slice(location.length - 4)].join('')
        assetDraggable.src = path.join(project.assetsPath, location + "?random=" + new Date().getTime())
        assetElement.className += ' animated'
    } else 
        assetDraggable.src = path.join(project.assetsPath, asset.location + "?random=" + new Date().getTime()) 
    if (id.split(':')[0] !== settings.settings.uuid) {
        assetElement.className += ' downloaded'
    }

    if (document.getElementById('asset-name').asset === id) {
        openAssetSettings(id)
    }
}

exports.clear = function() {
    character = null
    oldcharacter = 'null'
}

exports.resetChanges = function() {
    alwaysDifferent = true
    document.getElementById("editor-save").classList.add("highlight")
}

exports.resize = function() {
    stage.resize()
}

// Returns true if its safe to change puppet
exports.checkChanges = function() {
    if (character && (JSON.stringify(character) !== oldcharacter || alwaysDifferent)) {
        let response = remote.dialog.showMessageBox({
            "type": "question",
            "buttons": ["Don't Save", "Cancel", "Save"],
            "defaultId": 2,
            "title": "Save Project?",
            "message": "Do you want to save the changes to " + character.name + "?",
            "detail": "If you don't save, your changes will be lost.",
            "cancelId": 1
        })

        switch (response) {
            default:
                break
            case 1:
                return false
            case 2:
                savePuppet()
                break
        }
    }
    return true
}

exports.setPuppet = function(newCharacter, override, preserveHistory) {
    selected = null
    if (selectedGui) stage.stage.removeChild(selectedGui)
    clickableAssets = []

    if (!override && !exports.checkChanges())
        return

    character = newCharacter
    if (!preserveHistory) {
        oldcharacter = JSON.stringify(character)
        history = reverseHistory = []
        document.getElementById("editor-save").classList.remove("highlight")
        alwaysDifferent = false
    }
    puppet = stage.createPuppet(character)
    stage.setPuppet(1, puppet)

    // Update Editor Panels
    let selectedElements = document.getElementById('editor-layers').getElementsByClassName("selected")
    while (selectedElements.length)
        selectedElements[0].classList.remove("selected")
    document.getElementById(layer).className += " selected"
    updateEmoteDropdown()

    // Close panels if not in editor view
    if (settings.settings.view !== 'editor') {
        document.getElementById('editor-open-panel').style.display = 'none'
        document.getElementById('editor-emotes-panel').style.display = 'none'
        document.getElementById('editor-settings-panel').style.display = 'none'
        document.getElementById('editor-open').classList.remove('open-tab')
        document.getElementById('editor-emotes').classList.remove('open-tab')
        document.getElementById('editor-settings').classList.remove('open-tab')
    }
    toggleEditorScreen(true)

    document.getElementById('editor-name').value = character.name
    document.getElementById('deadbonesstyle').checked = character.deadbonesStyle
    document.getElementById('eyeBabbleDuration').value = character.eyeBabbleDuration || 2000
    document.getElementById('mouthBabbleDuration').value = character.mouthBabbleDuration || 270
}

exports.keyDown = function(e) {
    let key = e.keyCode ? e.keyCode : e.which
    if (selected) {
        let value = e.shiftKey ? 10 : 1
        let handled = false
        if (key == 37 || key == 65) {
            selected.x -= value
            selectedGui.x = selected.x * scale + selectedGui.pivot.x
            handled = true
        } else if (key == 39 || key == 68) {
            selected.x += value
            selectedGui.x = selected.x * scale + selectedGui.pivot.x
            handled = true
        } else if (key == 38 || key == 87) {
            selected.y -= value
            selectedGui.y = selected.y * scale + selectedGui.pivot.y
            handled = true
        } else if (key == 40 || key == 83) {
            selected.y += value
            selectedGui.y = selected.y * scale + selectedGui.pivot.y
            handled = true
        }
        if (handled) {
            recordChange()
            return true
        }
    }
    // Copy and paste
    // the accelerators don't work (tried on windows and linux) unless you're holding down some other button as well (I use the windows key)
    // but this gets around that issue, albeit in a sort of hacky way. Untested on macOS
    if (key == 67 && e.ctrlKey) {
        copy()
    } else if (key == 86 && e.ctrlKey) {
        paste()
    } else if (key == 88 && e.ctrlKey) {
        cut()
    }
    return false
}

exports.reloadPuppetList = function() {
    let charList = document.getElementById('char open list')
    charList.innerHTML = ''
    let characters = Object.keys(project.characters)
    for (let j = 0; j < characters.length; j++) {
        let selector = document.createElement('div')
        selector.id = project.characters[characters[j]].name.toLowerCase()
        selector.className = "char"
        if (fs.existsSync(path.join(project.assetsPath, '..', 'thumbnails', 'new-' + characters[j] + '.png')))
            selector.style.backgroundImage = 'url(' + path.join(project.assetsPath, '..', 'thumbnails', 'new-' + characters[j] + '.png?random=' + new Date().getTime()).replace(/\\/g, '/') + ')'
        else
            selector.style.backgroundImage = 'url(' + path.join(project.assetsPath, '..', 'thumbnails', characters[j] + '.png?random=' + new Date().getTime()).replace(/\\/g, '/') + ')'
        charList.appendChild(selector)
        selector.innerHTML = '<div class="desc">' + project.characters[characters[j]].name + '</div>'
        selector.charid = characters[j]
        selector.addEventListener('click', openPuppet)
    }
}

exports.connect = function() {
    networking = true
    document.getElementById('delete-asset').disabled = document.getElementById('delete-asset').asset.split(':')[0] !== settings.settings.uuid
}

exports.disconnect = function() {
    networking = false
    document.getElementById('delete-asset').disabled = false
}

function drawBox(box) {
    box.lineStyle(4, 0x242a33)
    box.moveTo(stage.screen.clientWidth / 2 - selected.width / 2 * scale - 12, stage.screen.clientHeight + selected.height / 2 * scale + 12)
    box.lineTo(stage.screen.clientWidth / 2 - selected.width / 2 * scale - 12, stage.screen.clientHeight - selected.height / 2 * scale - 12)
    box.lineTo(stage.screen.clientWidth / 2 + selected.width / 2 * scale + 12, stage.screen.clientHeight - selected.height / 2 * scale - 12)
    box.lineTo(stage.screen.clientWidth / 2 + selected.width / 2 * scale + 12, stage.screen.clientHeight + selected.height / 2 * scale + 12)
    box.lineTo(stage.screen.clientWidth / 2 - selected.width / 2 * scale - 12, stage.screen.clientHeight + selected.height / 2 * scale + 12)
    box.lineStyle(2, 0x242a33, 0.5)
    box.drawCircle(stage.screen.clientWidth / 2 + selected.width / 2 * scale + 12, stage.screen.clientHeight - selected.height / 2 * scale - 12, 24)
}

function setSelected(asset) {
    selected = asset
    if (selectedGui) stage.stage.removeChild(selectedGui)
    selectedGui = new Container()
    let box = new Graphics()
    drawBox(box)
    selectedGui.addChild(box)
    selectedGui.box = box
    let corners = []
    for (let i = 0; i < 4; i++) {
        let graphics = new Graphics()
        graphics.lineStyle(2, 0x5464d4)
        graphics.beginFill(0x242a33)
        graphics.drawCircle(0, 0, 6)
        corners[i] = new Sprite(graphics.generateCanvasTexture(1))
        corners[i].x = stage.screen.clientWidth / 2 - selected.width / 2 * scale - 20 + (24 + selected.width * scale) * (i % 2)
        corners[i].y = stage.screen.clientHeight - selected.height / 2 * scale - 20 + (24 + selected.height * scale) * Math.floor(i / 2)
        selectedGui.addChild(corners[i])
        corners[i].i = i
        corners[i].interactive = true
        corners[i].on('mousedown', resizeMousedown)
    }
    selectedGui.corners = corners
    let rotate = new Sprite.fromImage(path.join('assets', 'icons', 'rotate.png'))
    rotate.pivot.x = rotate.pivot.y = 0.5
    rotate.width = rotate.height = 24
    rotate.interactive = true
    rotate.on('mousedown', rotateMousedown)
    rotate.x = corners[1].x + 12
    rotate.y = corners[1].y - 24
    selectedGui.addChild(rotate)
    selectedGui.rotate = rotate
    let flipVert = new Sprite.fromImage(path.join('assets', 'icons', 'flipVert.png'))
    flipVert.pivot.x = flipVert.pivot.y = 0.5
    flipVert.width = flipVert.height = 24
    flipVert.interactive = true
    flipVert.on('mousedown', flipVertically)
    flipVert.x = corners[1].x + 24
    flipVert.y = corners[1].y
    selectedGui.addChild(flipVert)
    selectedGui.flipVert = flipVert
    let flipHoriz = new Sprite.fromImage(path.join('assets', 'icons', 'flipHoriz.png'))
    flipHoriz.pivot.x = flipHoriz.pivot.y = 0.5
    flipHoriz.width = flipHoriz.height = 24
    flipHoriz.interactive = true
    flipHoriz.on('mousedown', flipHorizontally)
    flipHoriz.x = corners[1].x - 12
    flipHoriz.y = corners[1].y - 32
    selectedGui.addChild(flipHoriz)
    selectedGui.flipHoriz = flipHoriz
    selectedGui.pivot.x = stage.screen.clientWidth / 2 - selected.width / 2 * scale - 12 + (24 + selected.width * scale) * 0.5
    selectedGui.pivot.y = stage.screen.clientHeight - selected.height / 2 * scale - 12 + (24 + selected.height * scale) * 0.5
    selectedGui.x = selected.x * scale + selectedGui.pivot.x
    selectedGui.y = selected.y * scale + selectedGui.pivot.y
    selectedGui.rotation = selected.rotation
    stage.stage.addChild(selectedGui)
}

function editorMousedown(e) {
    let closest = null
    let distance = -1
    for(let i = 0; i < clickableAssets.length; i++){
        let bounds = clickableAssets[i].getBounds();
        let centerX = bounds.x + bounds.width/2;
        let centerY = bounds.y + bounds.height/2;
        let dx = centerX - e.data.global.x;
        let dy = centerY - e.data.global.y;
        let dist = dx*dx + dy*dy; //Distance is not squared as it's not needed.
        if((dist < distance || distance == -1) && clickableAssets[i].visible && clickableAssets[i].containsPoint(e.data.global) && clickableAssets[i].layer === layer) {
            if ((layer === 'mouth' || layer === 'eyes') && clickableAssets[i].emote !== (puppet.emote || 'default'))
                continue
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
            let rotation = Math.atan2(e.data.global.y - selectedGui.startY, e.data.global.x - selectedGui.startX)
            rotation = Math.round(rotation / ROUND_ROTATION) * ROUND_ROTATION
            let dist = Math.hypot(Math.cos(rotation) * (e.data.global.x - selectedGui.startX), Math.sin(rotation) * (e.data.global.y - selectedGui.startY)) / scale
            selected.x = selected.asset.x + Math.cos(rotation) * dist
            selected.y = selected.asset.y + Math.sin(rotation) * dist
        } else {
            let position = e.data.getLocalPosition(selected.parent)
            selected.x = position.x - selected.start.x
            selected.y = position.y - selected.start.y
        }

        // Round to nearest pixel, or 10 pixels
        if (e.data.originalEvent.shiftKey) {
            selected.x = Math.round(selected.x / 10) * 10
            selected.y = Math.round(selected.y / 10) * 10
        } else {
            selected.x = Math.round(selected.x)
            selected.y = Math.round(selected.y)
        }

        // Update selected GUI's position
        selectedGui.x = selected.x * scale + selectedGui.pivot.x
        selectedGui.y = selected.y * scale + selectedGui.pivot.y
    }
}

function resizeMousedown(e) {
    e.stopPropagation()
    selectedGui.dragging = true
    stage.stage.on('mousemove', resizeMousemove)
    window.addEventListener('mouseup', resizeMouseup)
    selectedGui.origWidth = selected.width
    selectedGui.origHeight = selected.height
    selectedGui.i = e.currentTarget.i
    let i = 1 - (selectedGui.i % 2) + 2 - 2 * Math.floor(selectedGui.i / 2)
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
    let dx, dy
    let rotation = Math.atan2(e.data.global.y - selectedGui.startY, e.data.global.x - selectedGui.startX)
    let dist = Math.hypot(e.data.global.x - selectedGui.startX, e.data.global.y - selectedGui.startY) / scale
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
    for (let i = 0; i < selectedGui.corners.length; i++) {
        selectedGui.corners[i].x = stage.screen.clientWidth / 2 / scale - selected.width / 2 - 20 + (24 + selected.width) * (i % 2)
        selectedGui.corners[i].y = stage.screen.clientHeight / scale - selected.height / 2 - 20 + (24 + selected.height) * Math.floor(i / 2)
    }
    selectedGui.rotate.x = selectedGui.corners[1].x + 12
    selectedGui.rotate.y = selectedGui.corners[1].y - 24
    selectedGui.flipHoriz.x = selectedGui.corners[1].x - 12
    selectedGui.flipHoriz.y = selectedGui.corners[1].y - 32
    selectedGui.flipVert.x = selectedGui.corners[1].x + 24
    selectedGui.flipVert.y = selectedGui.corners[1].y
    selectedGui.pivot.x = stage.screen.clientWidth / 2 - selected.width / 2 * scale - 12 + (24 + selected.width * scale) * 0.5
    selectedGui.pivot.y = stage.screen.clientHeight - selected.height / 2 * scale - 12 + (24 + selected.height * scale) * 0.5
    selectedGui.x = selected.x * scale + selectedGui.pivot.x
    selectedGui.y = selected.y * scale + selectedGui.pivot.y
}

function resizeMouseup() {
    selectedGui.dragging = false
    stage.stage.off('mousemove', resizeMousemove)
    window.removeEventListener('mouseup', resizeMouseup)
    selected.asset.scaleX /= selectedGui.origWidth / selected.width
    selected.asset.scaleY /= selectedGui.origHeight / selected.height
    selected.asset.x = selected.x
    selected.asset.y = selected.y
    recordChange()
}

function rotateMousedown(e) {
    e.stopPropagation()
    selectedGui.dragging = true
    stage.stage.on('mousemove', rotateMousemove)
    window.addEventListener('mouseup', rotateMouseup)
    selectedGui.startRotation = Math.atan2((stage.screen.clientHeight - e.data.global.y) / scale + selected.asset.y, (e.data.global.x - stage.screen.clientWidth / 2) / scale - selected.asset.x) + selected.asset.rotation
}

function rotateMousemove(e) {
    let rotation = selectedGui.startRotation - Math.atan2((stage.screen.clientHeight - e.data.global.y) / scale + selected.asset.y, (e.data.global.x - stage.screen.clientWidth / 2) / scale - selected.asset.x)
    if (e.data.originalEvent.ctrlKey)
        rotation = Math.round(rotation / ROUND_ROTATION) * ROUND_ROTATION
    selected.rotation = rotation
    selectedGui.rotation = rotation
}

function rotateMouseup() {
    selectedGui.dragging = false
    stage.stage.off('mousemove', rotateMousemove)
    window.removeEventListener('mouseup', rotateMouseup)
    selected.asset.rotation = selected.rotation
    recordChange()
}

function flipVertically(e) {
    e.stopPropagation()
    selected.height *= -1
    selected.asset.scaleY *= -1
    recordChange()
}

function flipHorizontally(e) {
    e.stopPropagation()
    selected.width *= -1
    selected.asset.scaleX *= -1
    recordChange()
}

function mouseUp(e) {
    if (asset) {
        if (asset.dragging || asset.clicked) {
            let rect = document.getElementById('editor-screen').getBoundingClientRect()
            if (rect.left < e.clientX && rect.right > e.clientX && rect.top < e.clientY && rect.bottom > e.clientY) {
                selected = null
                if (selectedGui) stage.stage.removeChild(selectedGui)
                let newAsset = {
                    "id": asset.asset,
                    "x": Math.round((e.clientX - rect.left - rect.width / 2) / scale),
                    "y": Math.round((e.clientY - rect.bottom) / scale),
                    "rotation": 0,
                    "scaleX": 1,
                    "scaleY": 1
                }
                switch (layer) {
                    case "mouth":
                        puppet.emotes[puppet.emote].mouth.addChild(stage.getAsset(newAsset, layer))
                        character.emotes[puppet.emote].mouth.push(newAsset)
                        break
                    case "eyes":
                        puppet.emotes[puppet.emote].eyes.addChild(stage.getAsset(newAsset, layer))
                        character.emotes[puppet.emote].eyes.push(newAsset)
                        break
                    default:
                        puppet[layer].addChild(stage.getAsset(newAsset, layer))
                        character[layer === 'headBase' ? 'head' : layer].push(newAsset)
                        break
                }
                recordChange()
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
    if (selected && selected.dragging) {
        if (selected.y > selected.height / 2)
            deleteKey()
        else {
            selected.dragging = false
            selected.asset.x = selected.x
            selected.asset.y = selected.y
            recordChange()
        }
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
        openAssetSettings(e.target.asset)
    }
}

function openAssetSettings(id) {
    document.getElementById('assets').style.display = 'none'
    document.getElementById('asset editor').style.display = ''
    document.getElementById('asset selected').style.display = ''
    let asset = project.assets[id]
    let enabled = settings.settings.uuid === id.split(':')[0]
    let elements = ['asset-tab', 'asset-name', 'asset-type', 'replace-asset']
    document.getElementById('asset-type').value = asset.type ? asset.type.charAt(0).toUpperCase() + asset.type.slice(1) : "Sprite"
    if (asset.type === "animated") {
        let location = asset.location
        location = [location.slice(0, location.length - 4), '.thumb', location.slice(location.length - 4)].join('')
        document.getElementById('asset selected').style.background = 'url(' + path.join(project.assetsPath, location + "?random=" + new Date().getTime()).replace(/\\/g, '/') + ') center no-repeat/contain'
        document.getElementById('animated-settings').style.display = ''
        document.getElementById('animated-spritesheet').src = path.join(project.assetsPath, asset.location + "?random=" + new Date().getTime()).replace(/\\/g, '/')
        document.getElementById('animation-rows').value = asset.rows
        document.getElementById('animation-cols').value = asset.cols
        document.getElementById('animation-numFrames').value = asset.numFrames
        document.getElementById('animation-delay').value = asset.delay
        elements = elements.concat(['animation-rows', 'animation-cols', 'animation-numFrames', 'animation-delay'])
    } else {
        document.getElementById('asset selected').style.background = 'url(' + path.join(project.assetsPath, asset.location + "?random=" + new Date().getTime()).replace(/\\/g, '/') + ') center no-repeat/contain'
        document.getElementById('animated-settings').style.display = 'none'
    }
    document.getElementById('asset-tab').value = asset.tab
    document.getElementById('asset-name').value = asset.name
    document.getElementById('duplicate-asset').asset = id
    document.getElementById('delete-asset').asset = id
    document.getElementById('delete-asset').disabled = !enabled && networking
    for (let i = 0; i < elements.length; i++) {
        document.getElementById(elements[i]).asset = id
        document.getElementById(elements[i]).disabled = !enabled
    }
}

function moveAsset(e) {
    asset.dragging = true
    asset.style.top = (e.clientY - asset.height / 2) + 'px'
    asset.style.left = (e.clientX - asset.width / 2) + 'px'
}

function savePuppet() {
    status.log('Saving puppet...', 2, 1)
    selected = null
    if (selectedGui) stage.stage.removeChild(selectedGui)
    oldcharacter = JSON.stringify(character)

    // Get thumbnails for the different emotes
    let emoteThumbnails = {}
    let emote = puppet.emote
    // Disable all layers except the head and emotes
    puppet.body.visible = false
    puppet.hat.visible = false
    puppet.props.visible = false
    let emotes = Object.keys(puppet.emotes)
    let empty = document.createElement('canvas')
    empty.width = stage.renderer.view.width
    empty.height = stage.renderer.view.height
    for (let i = 0; i < emotes.length; i++) {
        puppet.changeEmote(i)
        if (stage.renderer.view.toDataURL() !== empty.toDataURL())
            emoteThumbnails[i] = stage.getThumbnail()
    }
    puppet.changeEmote(emote)
    puppet.body.visible = true
    puppet.hat.visible = true
    puppet.props.visible = true

    // Save character
    controller.saveCharacter(JSON.parse(oldcharacter), stage.renderer.view.toDataURL() === empty.toDataURL() ? null : stage.getThumbnail(), emoteThumbnails)
    document.getElementById("editor-save").classList.remove("highlight")
    status.log('Puppet saved!', 1, 1)
    exports.reloadPuppetList()
}

function newPuppet() {
    exports.setPuppet(JSON.parse(project.getEmptyCharacter()))
}

function dupePuppet() {
    exports.setPuppet(JSON.parse(project.duplicateCharacter(character)))
    exports.resetChanges()
}

function importPuppet() {
    remote.dialog.showOpenDialog(remote.BrowserWindow.getFocusedWindow(), {
        title: 'Select Project',
        defaultPath: path.join(remote.app.getPath('home'), 'projects'),
        filters: [
            {name: 'Babble Buds Project File', extensions: ['babble']},
            {name: 'All Files', extensions: ['*']}
        ],
        properties: [
            'openFile'
        ] 
        }, (filepaths) => {
            if (filepaths) {
                fs.readJson(filepaths[0], (err, project) => {
                    if (err) console.log(err)
                    importing = {}
                    controller.openModal("#importPuppets")
                    document.getElementById('import-all-puppets').checked = false
                    let puppetsList = document.getElementById('import-puppets')
                    puppetsList.innerHTML = ''
                    let projectAssets = {}
                    let oldAssets = {}
                    if (project.assets) {
                        let numAssets = 0
                        let assets = fs.readJsonSync(path.join(filepaths[0], '..', 'assets', project.assets[i].location))
                        let keys = Object.keys(assets)
                        for (let j = 0; j < keys.length; j++) {
                            assets[keys[j]].tab = project.assets[i].name
                            projectAssets["invalid:" + numAssets] = assets[keys[j]]
                            oldAssets[project.assets[i].name][keys[j]] = numAssets
                            numAssets++
                        }
                    } else {
                        projectAssets = fs.readJsonSync(path.join(filepaths[0], '..', 'assets', "assets.json"))
                    }
                    let callback = function(err, character) {
                        // this = {name: string, id: number, location: string}
                        if (err) console.log(err)
                        let puppet = document.createElement('div')                    
                        if (project.assets) {
                            let topLevel = ["body", "head", "hat", "props"]
                            for (let j = 0; j < topLevel.length; j++)
                                for (let k = 0; k < character[topLevel[j]].length; k++) {
                                    character[topLevel[j]][k].id = "invalid:" + oldAssets[character[topLevel[j]][k].tab][character[topLevel[j]][k].hash]
                                    delete character[topLevel[j]][k].tab
                                    delete character[topLevel[j]][k].hash                                }

                            let emotes = Object.keys(character.emotes)
                            for (let j = 0; j < emotes.length; j++) {
                                for (let k = 0; k < character.emotes[emotes[j]].eyes.length; k++) {
                                    character.emotes[emotes[j]].eyes[k].id = "invalid:" + oldAssets[character.emotes[emotes[j]].eyes[k].tab][character.emotes[emotes[j]].eyes[k].hash]
                                    delete character.emotes[emotes[j]].eyes[k].tab
                                    delete character.emotes[emotes[j]].eyes[k].hash
                                }
                                for (let k = 0; k < character.emotes[emotes[j]].mouth.length; k++) {
                                    character.emotes[emotes[j]].mouth[k].id = "invalid:" + oldAssets[character.emotes[emotes[j]].mouth[k].tab][character.emotes[emotes[j]].mouth[k].hash]
                                    delete character.emotes[emotes[j]].mouth[k].tab
                                    delete character.emotes[emotes[j]].mouth[k].hash
                                }
                            }
                        }
                        puppet.id = 'import-puppet-' + this.id
                        puppet.character = character
                        puppet.name = this.name
                        puppet.location = path.join(filepaths[0], '..', 'characters', this.location)
                        puppet.assets = projectAssets
                        puppet.className = "char"
                        puppet.style.backgroundImage = 'url(' + path.join(filepaths[0], '..', 'thumbnails', this.id + '.png?random=' + new Date().getTime()).replace(/\\/g, '/') + ')'
                        puppet.innerHTML = '<div class="desc">' + this.name + '</div>'
                        puppet.addEventListener('click', toggleImportPuppet)
                        puppetsList.appendChild(puppet)
                    }
                    for (let i = 0; i < project.characters.length; i++) {
                        fs.readJson(path.join(filepaths[0], '..', 'characters', project.characters[i].location), callback.bind(project.characters[i]))
                    }
                })
            }
        }
    )
}

function toggleImportAllPuppets(e) {
    let importAll = e.target.checked
    let puppetsList = document.getElementById('import-puppets')
    for (let i = 0; i < puppetsList.childNodes.length; i++) {
        let char = puppetsList.childNodes[i]
        if ((char.className === "char selected") != importAll) {
            toggleImportPuppet({target: char})
        }
    }
}

function toggleImportPuppet(e) {
    if (e.target.className === 'char selected') {
        e.target.className = 'char'
        delete importing[e.target.id]
        document.getElementById('import-all-puppets').checked = false
    } else {
        e.target.className = 'char selected'
        importing[e.target.id] = {character: e.target.character, location: e.target.location, assets: e.target.assets}
    }
}

function confirmImportPuppets() {
    let chars = Object.keys(importing)
    for (let i = 0; i < chars.length; i++) {
        // Find any required assets we don't already have to the project
        let character = JSON.parse(project.duplicateCharacter(importing[chars[i]].character))
        let topLevel = ["body", "head", "hat", "props"]

        for (let j = 0; j < topLevel.length; j++)
            checkLayer(character[topLevel[j]], importing[chars[i]].assets, importing[chars[i]].location)

        let emotes = Object.keys(character.emotes)
        for (let j = 0; j < emotes.length; j++) {
            checkLayer(character.emotes[emotes[j]].eyes, importing[chars[i]].assets, importing[chars[i]].location)
            checkLayer(character.emotes[emotes[j]].mouth, importing[chars[i]].assets, importing[chars[i]].location)
        }
    }
    // Ensure all assets are loaded so we can save puppets properly
    controller.reloadAssets(() => {
        // Add puppets to project
        let oldcharacter = character
        for (let i = 0; i < chars.length; i++) {
            let character = JSON.parse(project.duplicateCharacter(importing[chars[i]].character))
            exports.setPuppet(character)
            savePuppet()
        }
        // Restore previous puppet
        exports.setPuppet(oldcharacter)
    })
    controller.openModal()
}

function checkLayer(layer, assets, characterPath) {
    for (let k = 0; k < layer.length; k++) {
        let asset = layer[k]
        // If we don't have the tab or the asset...
        if (!project.assets[asset.id]) {
            // Add it!
            importAsset({id: asset.id, asset: assets[asset.id], location: path.join(characterPath, '..', '..', 'assets', assets[asset.id].location)})
        }
    }
}

function openPuppet(e) {
    exports.setPuppet(JSON.parse(JSON.stringify(project.characters[e.target.charid])))
}

function updateCharSearch(e) {
    let list = document.getElementById('char open list')
    if (e.target.value === '') {
        for (let i = 0; i < list.children.length; i++)
            list.children[i].style.display = 'inline-block'
    } else {
        for (let i = 0; i < list.children.length; i++)
            list.children[i].style.display = 'none'
        let chars = list.querySelectorAll("[id*='" + e.target.value.toLowerCase() + "']")
        for (let i = 0; i < chars.length; i++) {
            chars[i].style.display = 'inline-block'
        }
    }
}

function toggleEditorScreen(toggle) {
    if (settings.settings.view === 'editor') return
    let enabled = (toggle == null ? document.getElementById('editor-screen').style.display === 'none' : toggle)
    document.getElementById('editor-screen').style.display = enabled ? '' : 'none'
    document.getElementById('editor-layers').style.display = enabled ? '' : 'none'
    if (enabled)
        stage.resize()
}

function openPuppetPanel() {
    document.getElementById('editor-emotes-panel').style.display = 'none'
    document.getElementById('editor-settings-panel').style.display = 'none'
    document.getElementById('editor-emotes').classList.remove('open-tab')
    document.getElementById('editor-settings').classList.remove('open-tab')
    let panel = document.getElementById('editor-open-panel')
    if (panel.style.display === 'none') {
        toggleEditorScreen(false)
        panel.style.display = ''
        document.getElementById('editor-open').classList.add('open-tab')
    } else if (settings.settings.view !== 'editor') {
        toggleEditorScreen(true)
        panel.style.display = 'none'
        document.getElementById('editor-open').classList.remove('open-tab')
    }
}

function toggleEmotes() {
    document.getElementById('editor-open-panel').style.display = 'none'
    document.getElementById('editor-settings-panel').style.display = 'none'
    document.getElementById('editor-open').classList.remove('open-tab')
    document.getElementById('editor-settings').classList.remove('open-tab')
    let panel = document.getElementById('editor-emotes-panel')
    if (panel.style.display === 'none') {
        toggleEditorScreen(false)
        panel.style.display = ''
        document.getElementById('editor-emotes').classList.add('open-tab')
        for (let i = 0; i < character.emotes.length; i++) {
            document.getElementById('emote-' + (i + 1)).emote = i
            if (character.emotes[i].enabled) {
                document.getElementById('emote-' + (i + 1)).className = "emote available"
            } else {
                document.getElementById('emote-' + (i + 1)).className = "emote"
            }
        }
        openEmote({target: document.getElementById('emote-1')})
    } else if (settings.settings.view !== 'editor') {
        toggleEditorScreen(true)
        panel.style.display = 'none'
        document.getElementById('editor-emotes').classList.remove('open-tab')
    }
}

function openEmote(e) {
    let emote = character.emotes[e.target.emote]
    document.getElementById('emote-name').value = emote.name
    document.getElementById('emote-name').disabled = e.target.emote === 0
    document.getElementById('emote-name').emote = e.target.emote
    document.getElementById('emote-enabled').checked = emote && emote.enabled
    document.getElementById('emote-eyes').checked = character.eyes.indexOf(e.target.emote) > -1
    document.getElementById('emote-mouth').checked = character.mouths.indexOf(e.target.emote) > -1
    document.getElementById('emote-enabled').disabled = e.target == document.getElementById('emote-1')
    document.getElementById('emote-enabled').button = e.target
}

function changeEmoteName(e) {
    let emote = e.target.emote
    character.emotes[emote].name = e.target.value
    updateEmoteDropdown()
    document.getElementById('emote-' + (emote + 1)).innerText = e.target.value
    recordChange()
}

function toggleEmoteEnabled(e) {
    let emote = document.getElementById('emote-name').emote
    if (character.emotes[emote] && character.emotes[emote].enabled && emote !== 'default') {
        character.emotes[emote].enabled = false
        e.target.button.classList.remove('available')
        updateEmoteDropdown()
    } else {
        if (character.emotes[emote]) {
            character.emotes[emote].enabled = true
            exports.setPuppet(character, true, true)
            e.target.button.className += " available"
            updateEmoteDropdown()
            document.getElementById('editor-emote').value = character.emotes[emote].name
        } else {
            character.emotes[emote] = {
                "enabled": true,
                "mouth": [],
                "eyes": []
            }
            puppet.emotes[emote] = {
                "mouth": new Container(),
                "eyes": new Container()
            }
            puppet.mouthsContainer.addChild(puppet.emotes[emote].mouth)
            puppet.eyesContainer.addChild(puppet.emotes[emote].eyes)
            e.target.button.className += " available"
            updateEmoteDropdown()
        }
    }
    recordChange()
}

function toggleBabbleMouth(e) {
    let emote = document.getElementById('emote-name').emote
    let index = character.mouths.indexOf(emote)
    if (index > -1) {
        character.mouths.splice(index, 1)
    } else {
        character.mouths.push(emote)
    }
    recordChange()
}

function toggleBabbleEyes(e) {
    let emote = document.getElementById('emote-name').emote
    let index = character.eyes.indexOf(emote)
    if (index > -1) {
        character.eyes.splice(index, 1)
    } else {
        character.eyes.push(emote)
    }
    recordChange()
}

function updateEmoteDropdown() {
    let emotes = Object.keys(character.emotes)
    let select = document.getElementById('editor-emote')
    select.innerHTML = ''
    for (let i = 0; i < emotes.length; i++) {
        let emote = character.emotes[emotes[i]]
        if (emote && emote.enabled) {
            let option = document.createElement('div')
            select.append(option)
            option.outerHTML = '<option>' + emote.name + '</option>'
        }
    }
    puppet.changeEmote()
}

function toggleSettings() {
    document.getElementById('editor-open-panel').style.display = 'none'
    document.getElementById('editor-emotes-panel').style.display = 'none'
    document.getElementById('editor-open').classList.remove('open-tab')
    document.getElementById('editor-emotes').classList.remove('open-tab')
    let panel = document.getElementById('editor-settings-panel')
    if (panel.style.display === 'none') {
        toggleEditorScreen(false)
        panel.style.display = ''
        document.getElementById('editor-settings').classList.add('open-tab')
    } else if (settings.settings.view !== 'editor') {
        toggleEditorScreen(true)
        panel.style.display = 'none'
        document.getElementById('editor-settings').classList.remove('open-tab')
    }
}

function setLayer(e) {
    layer = e.target.id
    let selected = document.getElementById('editor-layers').getElementsByClassName("selected")
    while (selected.length)
        selected[0].classList.remove("selected")
    document.getElementById(layer).className += " selected"
    selected = null
    if (selectedGui) stage.stage.removeChild(selectedGui)
}

function selectEmote(e) {
    puppet.changeEmote(e.target.value)
}

function nameChange(e) {
    character.name = e.target.value
    recordChange()
}

function bobbleChange(e) {
    character.deadbonesStyle = e.target.checked
    recordChange()
}

function eyeDurationChange(e) {
    character.eyeBabbleDuration = e.target.value
    recordChange()
}

function mouthDurationChange(e) {
    character.mouthBabbleDuration = e.target.value
    recordChange()
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
    exports.setPuppet(project.characters[project.actor.id], true)
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
        for (let i = 0; i < filepaths.length; i++) {
            let file = fs.readFileSync(filepaths[i])
            let name = filepaths[i].replace(/^.*[\\\/]/, '').replace(/.png/, '')
            let id = project.getNewAssetId()
            let tab = document.getElementById('asset tabs').value
            fs.ensureDirSync(path.join(project.assetsPath, settings.settings.uuid))
            fs.writeFileSync(path.join(project.assetsPath, settings.settings.uuid, id + '.png'), file)
            controller.addAsset(settings.settings.uuid + ":" + id, {
                "tab": tab, 
                "type": "sprite", 
                "version": 0,
                "name": name, 
                "location": path.join(settings.settings.uuid, id + '.png')
            })
        }
    })
}

function addAnimatedAsset() {
    remote.dialog.showOpenDialog(remote.BrowserWindow.getFocusedWindow(), {
        title: 'Add Animated Assets',
        filters: [
          {name: 'Animated Image', extensions: ['gif']},
          {name: 'Animated Spritesheet', extensions: ['png']}
        ],
        properties: [
          'openFile',
          'multiSelections'
        ] 
    }, (filepaths) => {
        if (!filepaths) return
        for (let i = 0; i < filepaths.length; i++) {
            let file = fs.readFileSync(filepaths[i])
            let name = filepaths[i].replace(/^.*[\\\/]/, '').replace(/.png/, '').replace(/.gif/, '')
            let rows = 1
            let cols = 1
            let numFrames = 1
            let delay = 60
            if (filepaths[i].substr(filepaths[i].length - 4) === ".gif") {
                // If gif, turn it into animated png spritesheet
                let gif = new GIF(file)
                let frames = gif.decompressFrames(true)
                numFrames = frames.length
                delay = frames[0].delay
                // Optimize rows and columns to make an approximately square sheet
                // (idk if this is useful but figured it wouldn't hurt)
                rows = Math.ceil(Math.sqrt(frames.length))
                cols = Math.ceil(frames.length / rows)
                let width = gif.raw.lsd.width
                let height = gif.raw.lsd.height
                // Create canvas to put each frame onto
                var canvas = document.createElement('canvas')
                var ctx = canvas.getContext('2d')
                canvas.width = width * cols
                canvas.height = height * rows
                for (let j = 0; j < rows; j++) {
                    for (let k = 0; k < cols; k++) {
                        if (numFrames <= j * cols + k) break
                        let frame = frames[j * cols + k]
                        let imageData = ctx.createImageData(frame.dims.width, frame.dims.height)
                        imageData.data.set(frame.patch)
                        ctx.putImageData(imageData, k * width + frame.dims.left, j * height + frame.dims.top)
                    }
                }
                file = new Buffer(canvas.toDataURL().replace(/^data:image\/\w+;base64,/, ""), 'base64')
            }
            let id = project.getNewAssetId()
            let tab = document.getElementById('asset tabs').value
            fs.ensureDirSync(path.join(project.assetsPath, settings.settings.uuid))
            fs.writeFileSync(path.join(project.assetsPath, settings.settings.uuid, id + '.png'), file)
            if (numFrames === 1) fs.copySync(path.join(project.assetsPath, settings.settings.uuid, id + '.png'), path.join(project.assetsPath, settings.settings.uuid, id + '.thumb.png'))
            else if (fs.existsSync(path.join(project.assetsPath, settings.settings.uuid, id + '.thumb.png')))
                fs.remove(path.join(project.assetsPath, settings.settings.uuid, id + '.thumb.png'))
            controller.addAsset(settings.settings.uuid + ":" + id, {
                "tab": tab, 
                "type": "animated", 
                "version": 0,
                "name": name, 
                "rows": rows, 
                "cols": cols, 
                "numFrames": numFrames, 
                "delay": delay, 
                "location": path.join(settings.settings.uuid, id + '.png')
            })
        }
    })
}

function importAssets() {
    remote.dialog.showOpenDialog(remote.BrowserWindow.getFocusedWindow(), {
        title: 'Select Project',
        defaultPath: path.join(remote.app.getPath('home'), 'projects'),
        filters: [
            {name: 'Babble Buds Project File', extensions: ['babble']},
            {name: 'All Files', extensions: ['*']}
        ],
        properties: [
            'openFile'
        ] 
        }, (filepaths) => {
            if (filepaths) {
                fs.readJson(filepaths[0], (err, project) => {
                    if (err) console.log(err)
                    importing = {}
                    controller.openModal("#importAssets")
                    document.getElementById('import-all').checked = false
                    let assetsList = document.getElementById('import-assets')
                    assetsList.innerHTML = ''
                    let readAssetList = function(name, list) {
                        if (err) console.log(err)
                        let tab = document.createElement('div')
                        let addAll = document.createElement('input')
                        tab.appendChild(addAll)
                        addAll.outerHTML = '<hr><input type="checkbox" id="import-all-' + name + '" class="checkbox"><label for="import-all-' + name + '" class="checkbox-label">' + name + '</label><br/>'
                        let keys = Object.keys(list)
                        for (let i = 0; i < keys.length; i++) {
                            let asset = document.createElement('div')
                            asset.id = 'import-asset-' + keys[i]
                            asset.asset = keys[i]
                            asset.assetData = list[keys[i]]
                            asset.location = path.join(filepaths[0], '..', 'assets', list[keys[i]].location)
                            asset.className = "asset"
                            asset.innerHTML = '<div class="desc">' + list[keys[i]].name + '</div>'
                            if (list[keys[i]].type === "animated") {
                                let location = list[keys[i]].location
                                location = [location.slice(0, location.length - 4), '.thumb', location.slice(location.length - 4)].join('')
                                asset.style.backgroundImage = 'url(' + path.join(filepaths[0], '..', 'assets', location + '?random=' + new Date().getTime()).replace(/\\/g, '/') + ')'
                                asset.className += ' animated'
                            } else 
                                asset.style.backgroundImage = 'url(' + path.join(filepaths[0], '..', 'assets', list[keys[i]].location + '?random=' + new Date().getTime()).replace(/\\/g, '/') + ')'
                            asset.addEventListener('click', toggleImportAsset)
                            tab.appendChild(asset)
                        }
                        assetsList.appendChild(tab)
                        document.getElementById('import-all-' + this).addEventListener('click', toggleImportList)
                    }
                    if (project.assets) {
                        let numAssets = 0
                        let callback = function(err, list) {
                            // "this" refers to the name of the asset list
                            if (err) console.log(err)
                            let keys = Object.keys(list)
                            let assets = {}
                            for (let j = 0; j < keys.length; j++) {
                                list[keys[j]].tab = this.valueOf()
                                list[keys[j]].version = 0
                                assets["invalid:" + numAssets] = list[keys[j]]
                                this.numAssets++
                            }
                            readAssetList(this.valueOf(), assets)
                        }
                        for (let i = 0; i < project.assets.length; i++) {
                            fs.readJson(path.join(filepaths[0], '..', 'assets', project.assets[i].location), callback.bind(project.assets[i].name))
                        }
                    } else {
                        fs.readJson(path.join(filepaths[0], '..', 'assets', "assets.json"), (err, list) => {
                            let assetLists = {}
                            let keys = Object.keys(list)
                            for (let i = 0; i < keys.length; i++) {
                                if (!assetLists[list[keys[i]].tab]) {
                                    assetLists[list[keys[i]].tab] = {}
                                }
                                assetLists[list[keys[i]].tab][keys[i]] = list[keys[i]]
                            }
                            leys = Object.keys(assetLists)
                            for (let i = 0; i < keys.length; i++) {
                                readAssetList(keys[i], assetLists[keys[i]])
                            }
                        })
                    }
                })
            }
        }
    )
}

function toggleImportAll(e) {
    let importAll = e.target.checked
    let assetList = document.getElementById('import-assets')
    for (let i = 0; i < assetList.childNodes.length; i++) {
        let list = assetList.childNodes[i]
        list.childNodes[1].checked = importAll
        // First four are hr, checkbox, label, and br
        for (let j = 4; j < list.childNodes.length; j++) {
            let asset = list.childNodes[j]
            if ((asset.className === "asset selected") != importAll) {
                toggleImportAsset({target: asset})
            }
        }
    }
}

function toggleImportList(e) {
    let importAll = e.target.checked
    for (let i = 4; i < e.target.parentNode.childNodes.length; i++) {
        let asset = e.target.parentNode.childNodes[i]
        if ((asset.className === "asset selected") != importAll) {
            toggleImportAsset({target: asset})
        }
    }
}

function toggleImportAsset(e) {
    if (e.target.className === 'asset selected' || e.target.className === 'asset selected animated') {
        e.target.className = 'asset' + (e.target.asset.type === "animated" ? " animated" : "")
        delete importing[e.target.id]
        e.target.parentNode.childNodes[1].checked = false
        document.getElementById('import-all').checked = false
    } else {
        e.target.className = 'asset selected' + (e.target.asset.type === "animated" ? " animated" : "")
        importing[e.target.id] = {id: e.target.asset, asset: e.target.assetData, location: e.target.location}
    }
}

function confirmImportAssets() {
    let assets = Object.keys(importing)
    for (let i = 0; i < assets.length; i++) {
        importAsset(importing[assets[i]])
    }
    controller.openModal()
}

function importAsset(asset) {
    fs.ensureDirSync(path.join(project.assetsPath, settings.settings.uuid))
    fs.copySync(asset.location, path.join(project.assetsPath, settings.settings.uuid, asset.id.split(':')[1] + '.png'))
    if (asset.asset.type === 'animated') {
        let location = asset.location
        location = [location.slice(0, location.length - 4), '.thumb', location.slice(location.length - 4)].join('')
        fs.copySync(location, path.join(project.assetsPath, settings.settings.uuid, asset.id.split(':')[1] + '.thumb.png'))
    }
    controller.addAsset(asset.id, asset.asset)
}

function editAssetList() {
    if (Object.keys(project.assets).length === 0) return
    if (document.getElementById('asset list editor').style.display === 'none') {
        document.getElementById('assets').style.display = 'none'
        document.getElementById('asset list editor').style.display = ''
        document.getElementById('asset-list-name').value = document.getElementById('asset tabs').value
        document.getElementById('asset-list-name').tab = document.getElementById('asset tabs').value
        document.getElementById('delete-asset-list').tab = document.getElementById('asset tabs').value
        document.getElementById('edit-asset-list').classList.add('open-tab')
        document.getElementById('asset editor').style.display = 'none'
        document.getElementById('asset selected').style.display = 'none'
    } else {
        document.getElementById('assets').style.display = ''
        document.getElementById('asset list editor').style.display = 'none'
        document.getElementById('edit-asset-list').classList.remove('open-tab')
    }
}

function renameAssetList(e) {
    controller.renameAssetList(e.target.tab, e.target.value)
}

function deleteAssetList(e) {
    controller.deleteAssetList(e.target.tab)
    document.getElementById('edit-asset-list').classList.remove('open-tab')
}

function newAssetList() {
    // Calculate name for new asset list
    let name = "New Asset List", i = 0
    while (assetTabs.indexOf(name) !== -1)
        name = "New Asset List (" + (++i) + ")"
    // Add list to DOM
    addAssetListToDom(name)
    // Select new list
    document.getElementById('asset tabs').value = name
    for (let i = 0; i < assetTabs; i++)
        document.getElementById('tab ' + assetTabs[i]).style.display = 'none'
    document.getElementById('tab ' + name).style.display = ''
}

function addAssetListToDom(name) {
    assetTabs.push(name)
    let tabElement = document.createElement('div')
    tabElement.style.height = '100%'
    tabElement.id = 'tab ' + name
    tabElement.style.display = 'none'
    tabElement.className = 'scroll'
    document.getElementById('asset list').appendChild(tabElement)
    let tabOption = document.createElement('option')
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
    document.getElementById('asset selected').style.display = 'none'
}

function migrateAsset(e) {
    controller.changeAssetTab(e.target.asset, e.target.value)
    e.target.tab = e.target.value
}

function renameAsset(e) {
    let asset = project.assets[e.target.asset]
    asset.name = e.target.value
    controller.updateAsset(e.target.asset)
}

function assetType(e) {
    let asset = project.assets[e.target.asset]
    asset.type = e.target.value.toLowerCase()
    if (e.target.value.toLowerCase() === "animated") {
        asset.rows = asset.rows || 1
        asset.cols = asset.cols || 1
        asset.numFrames = asset.numFrames || 1
        asset.delay = asset.delay || 60
        let location = asset.location
        location = [location.slice(0, location.length - 4), '.thumb', location.slice(location.length - 4)].join('')
        if (!fs.existsSync(path.join(project.assetsPath, location))) {
            fs.copySync(path.join(project.assetsPath, asset.location), path.join(project.assetsPath, location))
        }
        document.getElementById('asset selected').style.background = 'url(' + path.join(project.assetsPath, location + "?random=" + new Date().getTime()).replace(/\\/g, '/') + ') center no-repeat/contain'
        document.getElementById('animated-settings').style.display = ''
        document.getElementById('animated-spritesheet').src = path.join(project.assetsPath, asset.location + "?random=" + new Date().getTime()).replace(/\\/g, '/')
        document.getElementById('animation-rows').value = asset.rows
        document.getElementById('animation-cols').value = asset.cols
        document.getElementById('animation-numFrames').value = asset.numFrames
        document.getElementById('animation-delay').value = asset.delay
    } else {
        document.getElementById('asset selected').style.background = 'url(' + path.join(project.assetsPath, asset.location + "?random=" + new Date().getTime()).replace(/\\/g, '/') + ') center no-repeat/contain'
        document.getElementById('animated-settings').style.display = 'none'
    }
    controller.updateAsset(e.target.asset)
}

function animationRows(e) {
    let asset = project.assets[e.target.asset]
    asset.rows = e.target.value
    controller.updateAsset(e.target.asset)
    recreateThumb(asset)
}

function animationCols(e) {
    let asset = project.assets[e.target.asset]
    asset.cols = e.target.value
    controller.updateAsset(e.target.asset)
    recreateThumb(asset)
}

function animationFrames(e) {
    let asset = project.assets[e.target.asset]
    asset.numFrames = e.target.value
    controller.updateAsset(e.target.asset)
}

function animationDelay(e) {
    let asset = project.assets[e.target.asset]
    asset.delay = e.target.value
    controller.updateAsset(e.target.asset)
}

function recreateThumb(asset) {
    let location = asset.location
    location = [location.slice(0, location.length - 4), '.thumb', location.slice(location.length - 4)].join('')
    let dimensions = sizeOf(path.join(project.assetsPath, asset.location))
    let width = Math.floor(dimensions.width / asset.cols)
    let height = Math.floor(dimensions.height / asset.rows)
    let image = new Image()
    image.onload = () => {
        let canvas = document.createElement('canvas')
        canvas.width = dimensions.width
        canvas.height = dimensions.height
        canvas.getContext('2d').drawImage(image, 0, 0)
        let data = canvas.getContext('2d').getImageData(0, 0, width, height)
        canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').putImageData(data, 0, 0)
        fs.writeFile(path.join(project.assetsPath, location), new Buffer(canvas.toDataURL().replace(/^data:image\/\w+;base64,/, ""), 'base64'), (err) => {
            if (err) console.log(err)
            document.getElementById('asset selected').style.background = 'url(' + path.join(project.assetsPath, location + "?random=" + new Date().getTime()).replace(/\\/g, '/') + ') center no-repeat/contain'
            document.getElementById(asset.name.toLowerCase()).children[1].src = path.join(project.assetsPath, location + "?random=" + new Date().getTime()).replace(/\\/g, '/')
        })
    }
    image.src = path.join(project.assetsPath, asset.location)
}

function duplicateAsset(e) {
    let newAsset = JSON.parse(JSON.stringify(project.assets[e.target.asset]))
    let id = project.getNewAssetId()
    newAsset.location = path.join(settings.settings.uuid, id + ".png")
    newAsset.version = 0
    fs.copySync(path.join(project.assetsPath, project.assets[e.target.asset].location), path.join(project.assetsPath, newAsset.location))
    controller.addAsset(settings.settings.uuid + ":" + id, newAsset)
    selectAsset()
}

function replaceAsset(e) {
    remote.dialog.showOpenDialog(remote.BrowserWindow.getFocusedWindow(), {
        title: 'Replace Asset',
        filters: [
          {name: 'Image', extensions: ['png']}
        ],
        properties: [
          'openFile'
        ] 
    }, (filepaths) => {
        if (!filepaths) return
        let asset = project.assets[e.target.asset]
        let file = fs.readFileSync(filepaths[0])
        fs.writeFileSync(path.join(project.assetsPath, asset.location), file)
        controller.updateAsset(e.target.asset)
    })
}

function deleteAsset(e) {
    if (remote.dialog.showMessageBox({
        "type": "question",
        "buttons": ["Delete Asset", "Cancel"],
        "defaultId": 1,
        "title": "Delete Asset?",
        "message": "Are you sure you want to delete this asset?",
        "detail": "This action cannot be undone.",
        "cancelId": 1
    }) === 0)
        controller.deleteAsset(e.target.asset)
}

function changeAssetTabs(e) {
    for (let i = 0; i < assetTabs.length; i++)
        document.getElementById('tab ' + assetTabs[i]).style.display = 'none'
    document.getElementById('tab ' + e.target.value).style.display = ''
}

function updateAssetSearch(e) {
    for (let i = 0; i < assetTabs.length; i++) {
        let list = document.getElementById('tab ' + assetTabs[i])
        if (e.target.value === '') {
            for (let j = 0; j < list.children.length; j++)
                list.children[j].style.display = ''
        } else {
            for (let j = 0; j < list.children.length; j++)
                list.children[j].style.display = 'none'
            let assetsElements = list.querySelectorAll("[id*='" + e.target.value.toLowerCase() + "']")
            for (let j = 0; j < assetsElements.length; j++) {
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
        switch (layer) {
            case "mouth":
                puppet.emotes[puppet.emote].mouth.removeChild(selected)
                character.emotes[puppet.emote].mouth.splice(character.emotes[puppet.emote].mouth.indexOf(selected.asset), 1)
                break
            case "eyes":
                puppet.emotes[puppet.emote].eyes.removeChild(selected)
                character.emotes[puppet.emote].eyes.splice(character.emotes[puppet.emote].eyes.indexOf(selected.asset), 1)
                break
            default:
                puppet[layer].removeChild(selected)
                character[layer === 'headBase' ? 'head' : layer].splice(character[layer === 'headBase' ? 'head' : layer].indexOf(selected.asset), 1)
                break
        }
        selected = null
        stage.stage.removeChild(selectedGui)
        recordChange()
    }
}

function copy() {
    if (selected) electron.clipboard.writeText(JSON.stringify(selected.asset))
}

function paste() {
    let newAsset
    try {
        newAsset = JSON.parse(electron.clipboard.readText())
    } catch (e) {
        return
    }
    let asset = stage.getAsset(newAsset, layer)
    switch (layer) {
        case "mouth":
            puppet.emotes[puppet.emote].mouth.addChild(stage.getAsset(newAsset, layer))
            character.emotes[puppet.emote].mouth.push(newAsset)
            break
        case "eyes":
            puppet.emotes[puppet.emote].eyes.addChild(stage.getAsset(newAsset, layer))
            character.emotes[puppet.emote].eyes.push(newAsset)
            break
        default:
            puppet[layer].addChild(stage.getAsset(newAsset, layer))
            character[layer === 'headBase' ? 'head' : layer].push(newAsset)
            break
    }
    setSelected(asset)
    recordChange()
}

function deleteKey() {
    if (selected) {
        switch (layer) {
            case "mouth":
                puppet.emotes[puppet.emote].mouth.removeChild(selected)
                character.emotes[puppet.emote].mouth.splice(character.emotes[puppet.emote].mouth.indexOf(selected.asset), 1)
                break
            case "eyes":
                puppet.emotes[puppet.emote].eyes.removeChild(selected)
                character.emotes[puppet.emote].eyes.splice(character.emotes[puppet.emote].eyes.indexOf(selected.asset), 1)
                break
            default:
                puppet[layer].removeChild(selected)
                character[layer === 'headBase' ? 'head' : layer].splice(character[layer === 'headBase' ? 'head' : layer].indexOf(selected.asset), 1)
                break
        }
        selected = null
        stage.stage.removeChild(selectedGui)
        recordChange()
    }
}

function recordChange() {
    reverseHistory = []
    let action = JSON.stringify(character)
    history.push(action)
    if (action === oldcharacter) {
        document.getElementById("editor-save").classList.remove("highlight")
    } else {
        document.getElementById("editor-save").classList.add("highlight")
    }
}

function undo() {
    if (history.length === 0 && JSON.stringify(character) === oldcharacter) return
    reverseHistory.push(history.pop())
    let action = history.length === 0 ? oldcharacter : history[history.length - 1]
    exports.setPuppet(JSON.parse(action), true, true)
    if (action === oldcharacter && !alwaysDifferent) {
        document.getElementById("editor-save").classList.remove("highlight")
    } else {
        document.getElementById("editor-save").classList.add("highlight")
    }
}

function redo() {
    if (reverseHistory.length === 0) return
    let action = reverseHistory.pop()
    history.push(action)
    exports.setPuppet(JSON.parse(action), true, true)
    if (action === oldcharacter && !alwaysDifferent) {
        document.getElementById("editor-save").classList.remove("highlight")
    } else {
        document.getElementById("editor-save").classList.add("highlight")
    }
}

function deselect(e) {
    if (e.target != stage.renderer.view && selected) {
        selected = null
        stage.stage.removeChild(selectedGui)
    }
    if (e.target.id !== "add-asset-dropdown") {
        document.getElementById("add-asset-dropdown").checked = false
    }
    if (e.target.id !== "add-puppet-dropdown") {
        document.getElementById("add-puppet-dropdown").checked = false
    }
}
