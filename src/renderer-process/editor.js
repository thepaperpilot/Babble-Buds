// Imports
const remote = require('electron').remote
const PIXI = require('pixi.js')
const path = require('path')
const fs = require('fs-extra')
const project = remote.require('./main-process/project')

// Aliases
var Container = PIXI.Container,
    autoDetectRenderer = PIXI.autoDetectRenderer,
    loader = PIXI.loader,
    resources = PIXI.loader.resources,
    Sprite = PIXI.Sprite,
    TextureCache = PIXI.utils.TextureCache,
    Rectangle = PIXI.Rectangle,
    NineSlicePlane = PIXI.mesh.NineSlicePlane,
    Graphics = PIXI.Graphics,
    Text = PIXI.Text,
    Ticker = PIXI.ticker.Ticker;

// Vars
var asset // asset being moved (outside of pixi)
var scale = 1 // scale of the editor view
var puppet // puppet being edited
var character // character being edited
var stage // pixi stage
var renderer // pixi renderer
var screen // element on webpage where stage is
var layer // layer being edited
var clickableAssets = [] // assets in editor that are clickable
var selected // selected asset inside of pixi
var selectedGui // gui that appears around selected

// Callback functions
var updateCharacter
var deleteCharacter
var addAsset

exports.setup = function(updateChar, deleteChar, addA) {
    // Save passed functions
    updateCharacter = updateChar
    deleteCharacter = deleteChar
    addAsset = addA

    // Create some basic objects
    stage = new Container()
    renderer = autoDetectRenderer(1, 1, {antialias: true, transparent: true})
    screen = document.getElementById('editor-screen')
    screen.appendChild(renderer.view)
    stage.interactive = true
    stage.on('mousedown', editorMousedown)
    stage.on('mousemove', editorMousemove)
    stage.on('mouseup', editorMouseup)

    // Make mousedown work on entire stage
    var backdrop = new PIXI.Container();
    backdrop.interactive = true;
    backdrop.containsPoint = () => true;
    stage.addChild(backdrop)

    // Make the game fit the entire window
    renderer.view.style.position = "absolute";
    renderer.view.style.display = "block";
    renderer.autoResize = true;

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

    // Setup Puppet
    layer = 'body'
    exports.setPuppet(JSON.parse(JSON.stringify(project.characters[project.actor.id])))
    resize()
    window.addEventListener("resize", resize)
    gameLoop()
}

exports.addAsset = function(tab, asset) {
    var assetElement = document.createElement('div')
    document.getElementById('tab ' + tab).appendChild(assetElement)
    assetElement.id = asset.toLowerCase()
    assetElement.className = "asset"
    assetElement.innerHTML = '<div class="desc">' + asset + '</div>'
    var assetDraggable = document.createElement('img')
    assetElement.appendChild(assetDraggable)
    assetDraggable.tab = tab
    assetDraggable.asset = asset
    assetDraggable.style.height = assetDraggable.style.width = '120px'
    assetDraggable.className = 'contain'
    assetDraggable.src = path.join(project.assetsPath, project.assets[tab][asset].location)
    assetDraggable.addEventListener('mousedown', mouseDown, false)
}

exports.setPuppet = function(newCharacter) {
    selected = null
    if (selectedGui) stage.removeChild(selectedGui)
    clickableAssets = []

    character = newCharacter
    var newPuppet = new Puppet(newCharacter)

    newPuppet.container.y = screen.clientHeight / scale
    newPuppet.container.x = (screen.clientWidth / scale) / 2

    if (puppet)
        stage.removeChild(puppet.container)
    puppet = newPuppet
    stage.addChild(puppet.container)
    resize()

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
    box.lineStyle(4)
    box.moveTo(screen.clientWidth / 2 / scale - selected.width / 2 - 12, screen.clientHeight / scale + selected.height / 2 + 12)
    box.lineTo(screen.clientWidth / 2 / scale - selected.width / 2 - 12, screen.clientHeight / scale - selected.height / 2 - 12)
    box.lineTo(screen.clientWidth / 2 / scale + selected.width / 2 + 12, screen.clientHeight / scale - selected.height / 2 - 12)
    box.lineTo(screen.clientWidth / 2 / scale + selected.width / 2 + 12, screen.clientHeight / scale + selected.height / 2 + 12)
    box.lineTo(screen.clientWidth / 2 / scale - selected.width / 2 - 12, screen.clientHeight / scale + selected.height / 2 + 12)
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
        selected = closest
        selected.dragging = true
        selected.start = {"x": e.data.getLocalPosition(closest.parent).x - selected.position.x, "y": e.data.getLocalPosition(closest.parent).y - selected.position.y}
        if (selectedGui) stage.removeChild(selectedGui)
        selectedGui = new Container()
        var box = new Graphics()
        drawBox(box)
        selectedGui.addChild(box)
        selectedGui.box = box
        var corners = []
        for (var i = 0; i < 4; i++) {
            var graphics = new Graphics()
            graphics.lineStyle(4)
            graphics.drawCircle(0, 0, 8)
            corners[i] = new Sprite(graphics.generateCanvasTexture(1))
            corners[i].x = screen.clientWidth / 2 / scale - selected.width / 2 - 22 + (24 + selected.width) * (i % 2)
            corners[i].y = screen.clientHeight / scale - selected.height / 2 - 22 + (24 + selected.height) * Math.floor(i / 2)
            selectedGui.addChild(corners[i])
            corners[i].i = i
            corners[i].interactive = true
            corners[i].on('mousedown', resizeMousedown)
        }
        selectedGui.corners = corners
        selectedGui.position.x = selected.position.x
        selectedGui.position.y = selected.position.y
        stage.addChild(selectedGui)
    } else if (selected) {
        selected = null
        stage.removeChild(selectedGui)
    }  
}

function editorMousemove(e) {
    if (selected && selected.dragging) {
        var position = e.data.getLocalPosition(selected.parent)
        selected.x = position.x - selected.start.x
        selected.y = position.y - selected.start.y
        selectedGui.x = selected.x
        selectedGui.y = selected.y
    }
}

function editorMouseup(e) {
    if (selected) {
        selected.dragging = false
        selected.asset.x = selected.x
        selected.asset.y = selected.y
        assetClicked = true
    }
}

function resizeMousedown(e) {
    e.stopPropagation()
    selectedGui.dragging = true
    stage.on('mousemove', resizeMousemove)
    stage.on('mouseup', resizeMouseup)
    selectedGui.origWidth = selected.width
    selectedGui.origHeight = selected.height
    selectedGui.i = e.currentTarget.i
    selectedGui.startX = e.data.global.x
    selectedGui.startY = e.data.global.y
}

function resizeMousemove(e) {
    var oldWidth = selected.width
    selected.width = Math.max(0, selectedGui.origWidth + (selectedGui.i % 2 == 1 ? 1 : -1) * (e.data.global.x - selectedGui.startX) / scale)
    selected.x -= (selectedGui.i % 2 == 1 ? 1 : -1) * (oldWidth - selected.width) / 2

    var oldHeight = selected.height
    selected.height = Math.max(0, selectedGui.origHeight + (Math.floor(selectedGui.i / 2) == 1 ? 1 : -1) * (e.data.global.y - selectedGui.startY) / scale)
    selected.y -= (Math.floor(selectedGui.i / 2) == 1 ? 1 : -1) * (oldHeight - selected.height) / 2

    selectedGui.box.clear()
    drawBox(selectedGui.box)
    for (var i = 0; i < selectedGui.corners.length; i++) {
        selectedGui.corners[i].x = screen.clientWidth / 2 / scale - selected.width / 2 - 22 + (24 + selected.width) * (i % 2)
        selectedGui.corners[i].y = screen.clientHeight / scale - selected.height / 2 - 22 + (24 + selected.height) * Math.floor(i / 2)
    }
    selectedGui.x = selected.x
    selectedGui.y = selected.y
}

function resizeMouseup(e) {
    selectedGui.dragging = false
    stage.off('mousemove', resizeMousemove)
    stage.off('mouseup', resizeMouseup)
    selected.asset.scaleX /= selectedGui.origWidth / selected.width
    selected.asset.scaleY /= selectedGui.origHeight / selected.height
}

function createPuppet(actor) {
    var puppet = JSON.parse(JSON.stringify(project.characters[actor.id]))
    puppet.emote = 'default'
    puppet.facingLeft = false
    return puppet
}

function resize() {
    renderer.resize(screen.clientWidth, screen.clientHeight)
    stage.scale.x = stage.scale.y = scale
    puppet.container.y = screen.clientHeight / scale
    puppet.container.x = (screen.clientWidth / scale) / 2
    selected = null
    if (selectedGui) stage.removeChild(selectedGui)
}

function gameLoop() {
    requestAnimationFrame(gameLoop)
    renderer.render(stage)
}

document.getElementById('editor-save').addEventListener('click', () => {
    project.characters[character.id] = character
    project.saveCharacter(character)
    selected = null
    if (selectedGui) stage.removeChild(selectedGui)
    renderer.render(stage)
    updateCharacter(character, renderer.view.toDataURL().replace(/^data:image\/\w+;base64,/, ""))
})

document.getElementById('editor-new').addEventListener('click', () => {
    exports.setPuppet(JSON.parse(project.getEmptyCharacter()))
})

document.getElementById('editor-duplicate').addEventListener('click', () =>  {
    exports.setPuppet(JSON.parse(project.duplicateCharacter(character)))
})

document.getElementById('editor-import').addEventListener('click', () => {
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
})

function openPuppet(e) {
    document.getElementById('editor-screen').style.display = ''
    document.getElementById('editor-open-panel').style.display = 'none'
    exports.setPuppet(JSON.parse(JSON.stringify(project.characters[e.target.charid])))
}

document.getElementById('editor-open').addEventListener('click', () => {
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
})

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

document.getElementById('char open search').addEventListener('keyup', updateCharSearch)

// This one's so that we capture clearing the search bar
document.getElementById('char open search').addEventListener('search', updateCharSearch)

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
    if (selectedGui) stage.removeChild(selectedGui)
}

document.getElementById('editor-layers').addEventListener('click', () => {
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
})

var buttons = document.getElementById('editor-layers-panel').getElementsByTagName('button')
for (var i = 0; i < buttons.length; i++)
    buttons[i].addEventListener('click', setLayer)

var emotes = document.getElementById('editor-layers-panel').getElementsByClassName('emote')
for (var i = 0; i < emotes.length; i++)
    emotes[i].addEventListener('contextmenu', (e) => {
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
    })

document.getElementById('editor-babble').addEventListener('click', () => {
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
})

emotes = document.getElementById('babble-mouths').getElementsByClassName('emote')
for (var i = 0; i < emotes.length; i++)
    emotes[i].addEventListener('click', (e) => {
        var emote = e.target.id.replace(/-mouth/, '')
        if (character.mouths.indexOf(emote) > -1) {
            character.mouths.splice(character.mouths.indexOf(emote), 1)
            e.target.classList.remove('available')
        } else {
            character.mouths.push(emote)
            e.target.className += ' available'
        }
    })

emotes = document.getElementById('babble-eyes').getElementsByClassName('emote')
for (var i = 0; i < emotes.length; i++)
    emotes[i].addEventListener('click', (e) => {
        var emote = e.target.id.replace(/-eyes/, '')
        if (character.eyes.indexOf(emote) > -1) {
            character.eyes.splice(character.eyes.indexOf(emote), 1)
            e.target.classList.remove('available')
        } else {
            character.eyes.push(emote)
            e.target.className += ' available'
        }
    })

document.getElementById('editor-settings').addEventListener('click', () => {
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
})

document.getElementById('editor-name').addEventListener('change', (e) => {
    character.name = e.target.value
})

document.getElementById('deadbonesstyle').addEventListener('click', (e) => {
    character.deadbonesStyle = e.target.checked
})

document.getElementById('delete-character').addEventListener('click', () => {
    if (character.id == project.actor.id) {
        remote.dialog.showErrorBox("Can't delete character", "You can't delete your active character. Please switch characters and try again.")
        return
    }
    project.deleteCharacter(character)
    deleteCharacter(character)
    for (var i = 0; i < project.project.characters.length; i++) {
        if (project.project.characters[i].id == character.id) {
            project.project.characters.splice(i, 1)
            delete project.characters[character.id]
        }
    }
    document.getElementById('editor-screen').style.display = ''
    document.getElementById('editor-settings-panel').style.display = 'none'
    exports.setPuppet(project.characters[project.actor.id])
})

document.getElementById('add-asset').addEventListener('click', () => {
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
        for (var i = 0; i < filepaths.length; i++) {
            var filename = filepaths[i].replace(/^.*[\\\/]/, '')
            var tab = document.getElementById('asset tabs').value
            fs.copySync(filepaths[i], path.join(project.assetsPath, tab, filename))
            if (!project.assets[tab])
                project.assets[tab] = {}
            project.assets[tab][asset] = {"location": path.join(tab, asset + '.png')}
            addAsset(tab, filename.replace(/.png/, ''))
        }
    })
})

document.getElementById('new-asset-bundle').addEventListener('click', () => {
    // TODO implement
})

document.getElementById('edit-asset-list').addEventListener('click', () => {
    // TODO implement
})

document.getElementById('new-asset-list').addEventListener('click', () => {
    // TODO implement
})

document.getElementById('import-asset-list').addEventListener('click', () => {
    // TODO implement
})

window.addEventListener('mouseup', mouseUp, false);

function mouseUp(e) {
    if (asset) {
        if (asset.dragging || asset.clicked) {
            window.removeEventListener('mousemove', moveAsset, true);
            asset.style.position = 'static'
            asset.style.cursor = ''
            asset.style.top = asset.style.left = ""
            asset.style.width = asset.style.height = 120 + "px"
            asset.style.zIndex = ''
            var rect = document.getElementById('editor-screen').getBoundingClientRect()
            if (rect.left < e.clientX && rect.right > e.clientX && rect.top < e.clientY && rect.bottom > e.clientY) {
                selected = null
                if (selectedGui) stage.removeChild(selectedGui)
                var newAsset = {
                    "tab": asset.tab,
                    "name": asset.asset,
                    "x": (e.clientX - rect.left - rect.width / 2) / scale,
                    "y": (e.clientY - rect.bottom) / scale,
                    "rotation": 0,
                    "scaleX": 1,
                    "scaleY": 1
                }
                if (layer.indexOf('-emote') > -1) {
                    if (document.getElementById('eyemouth').checked) {
                        puppet.emotes[layer.replace(/-emote/, '')].eyes.addChild(getAsset(newAsset, layer))
                        character.emotes[layer.replace(/-emote/, '')].eyes.push(newAsset)
                    } else {
                        puppet.emotes[layer.replace(/-emote/, '')].mouth.addChild(getAsset(newAsset, layer))
                        character.emotes[layer.replace(/-emote/, '')].mouth.push(newAsset)
                    }
                } else {
                    puppet[layer].addChild(getAsset(newAsset, layer))
                    character[layer].push(newAsset)
                }
            } 
            asset = null
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
    } else { /* TODO NYI
        document.getElementById('assets').style.display = 'none'
        document.getElementById('asset editor').style.display = ''
        document.getElementById('asset selected').getElementsByClassName('desc')[0].innerHTML = e.target.asset
        document.getElementById('asset selected').getElementsByTagName('img')[0].src = path.join(project.assetsPath, project.assets[e.target.tab][e.target.asset].location)
        document.getElementById('asset-tab').value = e.target.tab
        document.getElementById('asset-name').value = e.target.asset
        document.getElementById('asset-tab').tab = e.target.tab
        document.getElementById('asset-tab').asset = e.target.asset
        document.getElementById('asset-name').tab = e.target.tab
        document.getElementById('asset-name').asset = e.target.asset
        document.getElementById('delete-asset').tab = e.target.tab
        document.getElementById('delete-asset').asset = e.target.asset */
    }
}

document.getElementById('asset selected').addEventListener('click', () => {
    document.getElementById('assets').style.display = ''
    document.getElementById('asset editor').style.display = 'none'
})

for (var i = 0; i < project.project.assets.length; i++) {
    var tabOption = document.createElement('option')
    tabOption.text = project.project.assets[i].name
    document.getElementById('asset-tab').add(tabOption)
}

document.getElementById('asset-tab').addEventListener('change', function(e) {
    // TODO implement moving assets to new list
    // move asset to new folder
    // remove asset from current tab
    // add asset to new tab
    // update any character using asset in project
    // update character in editor if using it
    // tell server to tell other clients to move it
})

document.getElementById('asset-name').addEventListener('change', (e) => {
    // TODO implement renaming assets
    // rename asset in asset list
    // rename asset in project
    // update any character using asset in project
    // update character in editor if using it
    // tell server to tell other clients to rename it
})

document.getElementById('delete-asset').addEventListener('click', (e) => {
    // TODO implement deleting assets
    // remove asset from asset list
    // remove asset from project
    // remove asset from any character using it
    // update any character in babble using asset
    // update character in editor if using asset
    // tell server to tell other clients to delete asset
})

function moveAsset(e) {
    asset.dragging = true
    asset.style.top = (e.clientY - asset.height / 2) + 'px'
    asset.style.left = (e.clientX - asset.width / 2) + 'px'
}

document.getElementById('asset tabs').addEventListener('change', function(e) {
    var assetKeys = Object.keys(project.assets)
    for (var i = 0; i < assetKeys.length; i++)
        document.getElementById('tab ' + assetKeys[i]).style.display = 'none'
    document.getElementById('tab ' + e.target.value).style.display = ''
})

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

document.getElementById('asset search').addEventListener('keyup', updateAssetSearch)

// This one's so that we capture clearing the search bar
document.getElementById('asset search').addEventListener('search', updateAssetSearch)

document.getElementById('zoom in').addEventListener('click', () => {
    scale *= 2
    resize()
})

document.getElementById('zoom out').addEventListener('click', () => {
    scale /= 2
    resize()
})

// Puppet Prototype
var Puppet = function(puppet) {
    // Init Variables
    this.babbling = false
    this.name = puppet.name
    this.container = new Container()
    this.container.pivot.x = this.container.pivot.y = .5
    this.eyes = puppet.eyes
    this.mouths = puppet.mouths
    this.deadbonesStyle = puppet.deadbonesStyle
    this.eyesAnim = this.mouthAnim = this.deadbonesAnim = 0
    this.eyesDuration = this.mouthDuration = this.deadbonesDuration = 0
    this.deadbonesTargetY = this.deadbonesStartY = 0
    this.deadbonesTargetRotation = this.deadbonesStartRotation = 0

    // Construct Puppet
    this.body = new Container()
    for (var i = 0; i < puppet.body.length; i++) {
        this.body.addChild(getAsset(puppet.body[i], 'body'))
    }
    this.container.addChild(this.body)

    this.head = new Container()
    this.headBase = new Container()
    for (var i = 0; i < puppet.head.length; i++) {
        this.headBase.addChild(getAsset(puppet.head[i], 'head'))
    }
    this.head.addChild(this.headBase)
    this.emotes = {}
    this.mouthsContainer = new Container()
    this.eyesContainer = new Container()
    var emotes = Object.keys(puppet.emotes)
    for (var i = 0; i < emotes.length; i++) {
        if (!puppet.emotes[emotes[i]].enabled) continue
        this.emotes[emotes[i]] = {
            "mouth": new Container(),
            "eyes": new Container()
        }
        this.mouthsContainer.addChild(this.emotes[emotes[i]].mouth)
        this.eyesContainer.addChild(this.emotes[emotes[i]].eyes)
        for (var j = 0; j < puppet.emotes[emotes[i]].mouth.length; j++) {
            this.emotes[emotes[i]].mouth.addChild(getAsset(puppet.emotes[emotes[i]].mouth[j], emotes[i] + '-emote'))
        }
        for (var j = 0; j < puppet.emotes[emotes[i]].eyes.length; j++) {
            this.emotes[emotes[i]].eyes.addChild(getAsset(puppet.emotes[emotes[i]].eyes[j], emotes[i] + '-emote'))
        }
    }
    this.head.addChild(this.mouthsContainer)
    this.head.addChild(this.eyesContainer)
    this.hat = new Container()
    for (var i = 0; i < puppet.hat.length; i++) {
        this.hat.addChild(getAsset(puppet.hat[i], 'hat'))
    }
    this.head.addChild(this.hat)
    this.head.pivot.y = - this.headBase.height / 2
    this.head.y = - this.headBase.height / 2
    this.deadbonesTargetY = this.deadbonesStartY = - this.headBase.height / 2
    this.container.addChild(this.head)

    this.props = new Container()
    for (var i = 0; i < puppet.props.length; i++) {
        this.props.addChild(getAsset(puppet.props[i], 'props'))
    }
    this.container.addChild(this.props)

    // Finish Setup
    this.changeEmote(puppet.emote)

    // Place Puppet on Stage
    this.container.y = screen.clientHeight / scale
    this.container.x = (screen.clientWidth / scale) / 2

    // Face right
    this.container.scale.x = 1
}

Puppet.prototype.changeEmote = function (emote) {
    this.emote = emote
    var emotes = Object.keys(this.emotes)
    for (var i = 0; i < emotes.length; i++) {
        this.emotes[emotes[i]].mouth.visible = false
        this.emotes[emotes[i]].eyes.visible = false
    }
    if (this.emotes[emote]) {
        this.emotes[emote].mouth.visible = true
        this.emotes[emote].eyes.visible = true
    } else {
        this.emotes['default'].mouth.visible = true
        this.emotes['default'].eyes.visible = true
    }
}

function getAsset(asset, layer) {
    var sprite = new Sprite(TextureCache[path.join(project.assetsPath, project.assets[asset.tab][asset.name].location)])
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
