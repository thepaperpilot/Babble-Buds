// Imports
const electron = require('electron')
const remote = electron.remote
const PIXI = require('pixi.js')
const path = require('path')
const controller = require('./controller.js')
const assets = require('./assets.js')
const panels = require('./panels.js')
const settings = remote.require('./main-process/settings')
const status = require('./status.js') // jshint ignore: line
const babble = require('babble.js')
const fs = require('fs-extra')

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
let scale = 1 // scale of the editor view
let puppet // puppet being edited
let character // character being edited
let bundle // asset bundle id being edited, if applicable
let oldcharacter // currently saved version of character
let layer // layer being edited
let clickableAssets = [] // assets in editor that are clickable
let selected // selected asset inside of pixi
let selectedGui // gui that appears around selected
// used for undoing stuff:
let history = [] // jshint ignore: line 
let reverseHistory = [] // used for redoing stuff
let alwaysDifferent // If this is a new puppet, it should always be considered different from its initial value
let topLevel = ["body", "head", "hat", "props"] // The top level containers in puppets

// make public static variables
Object.defineProperty(exports, "character", {get: () => character})
Object.defineProperty(exports, "puppet", {get: () => puppet})
Object.defineProperty(exports, "scale", {get: () => scale})
Object.defineProperty(exports, "stage", {get: () => stage})

exports.init = function() {
    project = remote.getGlobal('project').project
    assets.init()
    panels.init()
    // Create some basic objects
    scale = project.project.puppetScale
    stage = new babble.Stage('editor-screen', {'numCharacters': 1, 'puppetScale': 1, 'assets': project.project.assets}, project.assets, project.assetsPath, null, status)
    window.addEventListener("resize", () => {stage.resize(); stage.resize();})
    stage.stage.interactive = true
    stage.stage.on('mousedown', editorMousedown)
    stage.stage.on('mousemove', editorMousemove)
    window.addEventListener('mouseup', mouseUp, false)

    // Override some parts of the stage
    stage.resize = function() {
        this.renderer.resize(this.screen.clientWidth, this.screen.clientHeight)
        this.slotWidth = this.screen.clientWidth
        this.puppetStage.scale.x = this.puppetStage.scale.y = scale
        puppet.container.y = this.screen.clientHeight / scale
        puppet.container.x = (this.screen.clientWidth / scale) / 2
        selected = null
        if (selectedGui) this.stage.removeChild(selectedGui)
    }
    stage.updateAsset = function(id) {
        let stage = this
        let callback = function(asset, sprite, layer, emote) {
            let parent = sprite.parent
            let index = parent.getChildIndex(sprite)
            clickableAssets.splice(clickableAssets.indexOf(sprite), 1)
            let newAsset = stage.getAsset(asset, layer, emote)
            parent.removeChildAt(index)
            parent.addChildAt(newAsset, index)
        }
        for (let i = 0; i < this.puppets.length; i++) {
            this.puppets[i].applyToAsset(id, callback)
        }
    }
    stage.getAsset = function(asset, layer, emote) {
        let sprite
        let assetData = this.assets[asset.id]
        if (assetData) {
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
        if (!assetData || assetData.type !== "bundle") {
            sprite.asset = asset
            sprite.layer = layer
            sprite.emote = emote
            clickableAssets.push(sprite)
        }
        return sprite
    }

    // Make mousedown work on entire stage
    let backdrop = new Container();
    backdrop.interactive = true;
    backdrop.containsPoint = () => true;
    stage.stage.addChild(backdrop)

    // DOM listeners
    document.getElementById('editor-emote').addEventListener('change', selectEmote)
    let buttons = document.getElementById('editor-layers').getElementsByTagName('button')
    for (let i = 0; i < buttons.length; i++)
        buttons[i].addEventListener('click', setLayer)
    document.getElementById('cancel-import-puppets').addEventListener('click', controller.openModal)
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
    // Set puppet to  the proper scale, since the original resize was before we overrode it
    stage.resize()
    exports.reloadPuppetList()
}

exports.updateAsset = function(id) {
    stage.updateAsset(id)
}

exports.deleteAsset = function(id) {
    let asset = project.assets[id]
    if (document.getElementById('delete-asset').asset === id) {
        assets.selectAsset()
    }
    let element = document.getElementById('tab ' + asset.tab).getElementsByClassName(id)[0]
    element.parentNode.removeChild(element)
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

exports.moveAsset = function(id, x, y) {
    let callback = (asset) => {
        asset.x += Math.cos(asset.rotation) * x - Math.sin(asset.rotation) * y
        asset.y += Math.cos(asset.rotation) * y + Math.sin(asset.rotation) * x
    }

    for (let j = 0; j < topLevel.length; j++)
        for (let k = 0; k < character[topLevel[j]].length; k++)
            if (character[topLevel[j]][k].id === id)
                callback(character[topLevel[j]][k], character[topLevel[j]], k)

    let emotes = Object.keys(character.emotes)
    for (let j = 0; j < emotes.length; j++) {
        for (let k = 0; k < character.emotes[emotes[j]].eyes.length; k++)
            if (character.emotes[emotes[j]].eyes[k].id === id)
                callback(character.emotes[emotes[j]].eyes[k], character.emotes[emotes[j]].eyes, k)
        for (let k = 0; k < character.emotes[emotes[j]].mouth.length; k++)
            if (character.emotes[emotes[j]].mouth[k].id === id)
                callback(character.emotes[emotes[j]].mouth[k], character.emotes[emotes[j]].mouth, k)
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
                exports.savePuppet()
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
    panels.updateEmoteDropdown()

    if (!preserveHistory) {
        // Close panels if not in editor view
        if (settings.settings.view !== 'editor') {
            document.getElementById('editor-open-panel').style.display = 'none'
            document.getElementById('editor-emotes-panel').style.display = 'none'
            document.getElementById('editor-settings-panel').style.display = 'none'
            document.getElementById('editor-open').classList.remove('open-tab')
            document.getElementById('editor-emotes').classList.remove('open-tab')
            document.getElementById('editor-settings').classList.remove('open-tab')
        }
        panels.toggleEditorScreen(true)
    }

    document.getElementById('editor-name').value = character.name
    document.getElementById('deadbonesstyle').checked = character.deadbonesStyle
    document.getElementById('eyeBabbleDuration').value = character.eyeBabbleDuration || 2000
    document.getElementById('mouthBabbleDuration').value = character.mouthBabbleDuration || 270

    // Undo asset bundle changes
    document.getElementById('editor-emotes').style.display = ''
    document.getElementById('editor-screen').classList.remove('bundle')
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
            exports.recordChange()
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

exports.placeAsset = function(asset, x, y) {
    selected = null
    if (selectedGui) stage.stage.removeChild(selectedGui)
    let newAsset = {
        "id": asset.asset,
        "x": Math.round(x / scale),
        "y": Math.round(y / scale),
        "rotation": 0,
        "scaleX": 1,
        "scaleY": 1
    }
    switch (layer) {
        case "mouth":
            puppet.emotes[puppet.emote].mouth.addChild(stage.getAsset(newAsset, layer, puppet.emote))
            character.emotes[puppet.emote].mouth.push(newAsset)
            break
        case "eyes":
            puppet.emotes[puppet.emote].eyes.addChild(stage.getAsset(newAsset, layer, puppet.emote))
            character.emotes[puppet.emote].eyes.push(newAsset)
            break
        default:
            puppet[layer].addChild(stage.getAsset(newAsset, layer))
            character[layer === 'headBase' ? 'head' : layer].push(newAsset)
            break
    }
    exports.recordChange()
}

exports.reloadPuppetList = function() {
    let charList = document.getElementById('char open list')
    charList.innerHTML = ''
    let characters = Object.keys(project.characters)
    for (let j = 0; j < characters.length; j++) {
        let selector = document.createElement('div')
        selector.id = project.characters[characters[j]].name.toLowerCase()
        selector.className = "char"
        if (fs.existsSync(path.join(project.charactersPath, '..', 'thumbnails', 'new-' + characters[j] + '.png')))
            selector.style.backgroundImage = 'url(' + path.join(project.charactersPath, '..', 'thumbnails', 'new-' + characters[j] + '.png?random=' + new Date().getTime()).replace(/\\/g, '/') + ')'
        else
            selector.style.backgroundImage = 'url(' + path.join(project.charactersPath, '..', 'thumbnails', characters[j] + '.png?random=' + new Date().getTime()).replace(/\\/g, '/') + ')'
        charList.appendChild(selector)
        selector.innerHTML = '<div class="desc">' + project.characters[characters[j]].name + '</div>'
        selector.charid = characters[j]
        selector.addEventListener('click', openPuppet)
    }
}

exports.connect = function() {
    if (document.getElementById('delete-asset').asset)
        document.getElementById('delete-asset').disabled = document.getElementById('delete-asset').asset.split(':')[0] !== settings.settings.uuid
}

exports.disconnect = function() {
    document.getElementById('delete-asset').disabled = false
}

exports.setBundle = function(id) {
    bundle = project.assets[id]
    exports.setPuppet(bundle.bundle)
    bundle.id = id

    document.getElementById('editor-emotes').style.display = 'none'
    document.getElementById('editor-screen').classList.add('bundle')
}

exports.savePuppet = function() {
    if (bundle) {
        saveBundle()
        return
    }

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
        stage.renderer.render(stage.stage)
        if (stage.renderer.view.toDataURL() !== empty.toDataURL())
            emoteThumbnails[i] = stage.getThumbnail()
    }
    puppet.changeEmote(emote)
    puppet.body.visible = true
    puppet.hat.visible = true
    puppet.props.visible = true

    // Save character
    stage.renderer.render(stage.stage)
    controller.saveCharacter(JSON.parse(oldcharacter), stage.renderer.view.toDataURL() === empty.toDataURL() ? null : stage.getThumbnail(), emoteThumbnails)
    document.getElementById("editor-save").classList.remove("highlight")
    status.log('Puppet saved!', 1, 1)
    exports.reloadPuppetList()
}

exports.recordChange = function() {
    reverseHistory = []
    let action = JSON.stringify(character)
    history.push(action)
    if (action === oldcharacter) {
        document.getElementById("editor-save").classList.remove("highlight")
    } else {
        document.getElementById("editor-save").classList.add("highlight")
    }
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
    status.info(selected)
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
            if ((layer === 'mouth' || layer === 'eyes') && clickableAssets[i].emote != (puppet.emote || 'default'))
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
            let step = 10 / scale
            selected.x = Math.round(Math.round(selected.x / step) * step)
            selected.y = Math.round(Math.round(selected.y / step) * step)
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
        selectedGui.corners[i].x = stage.screen.clientWidth / 2 - selected.width / 2 * scale - 20 + (24 + selected.width * scale) * (i % 2)
        selectedGui.corners[i].y = stage.screen.clientHeight - selected.height / 2 * scale - 20 + (24 + selected.height * scale) * Math.floor(i / 2)
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
    exports.recordChange()
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
    exports.recordChange()
}

function mouseUp() {
    if (selected && selected.dragging) {
        if (selected.y > selected.height / 2)
            deleteKey()
        else {
            selected.dragging = false
            selected.asset.x = selected.x
            selected.asset.y = selected.y
            exports.recordChange()
        }
    }
}

function flipVertically(e) {
    e.stopPropagation()
    selected.height *= -1
    selected.asset.scaleY *= -1
    exports.recordChange()
}

function flipHorizontally(e) {
    e.stopPropagation()
    selected.width *= -1
    selected.asset.scaleX *= -1
    exports.recordChange()
}

function zoomIn() {
    scale *= 1.5
    stage.resize()
}

function zoomOut() {
    scale -= scale / 3
    stage.resize()
}

function openPuppet(e) {
    exports.setPuppet(JSON.parse(JSON.stringify(project.characters[e.target.charid])))
}

function setLayer(e) {
    layer = e.target.id
    let selected = document.getElementById('editor-layers').getElementsByClassName("selected")
    while (selected.length)
        selected[0].classList.remove("selected")
    e.target.classList.add("selected")
    selected = null
    if (selectedGui) stage.stage.removeChild(selectedGui)
}

function selectEmote(e) {
    puppet.changeEmote(character.emotes.findIndex((emote) => emote.name === e.target.value))
}

function cut() {
    if (selected) {
        electron.clipboard.writeText(JSON.stringify(selected.asset))
        switch (layer) {
            case "bundle":
                puppet.container.removeChild(selected)
                for (var i = 0; i < selected.children.length; i++) {
                    selected.children[i].remove()
                }
                break
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
        exports.recordChange()
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
        case "bundle":
            if (project.assets[asset.asset].type !== "bundle") {
                status.log("Error: You cannot add a non-asset bundle to the asset bundles layer")
                 break
            }
            character.bundles.push(newAsset)
            exports.setPuppet(character, true, true)
            break
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
    exports.recordChange()
}

function deleteKey() {
    if (selected) {
        switch (layer) {
            case "bundle":
                puppet.container.removeChild(selected)
                for (var i = 0; i < selected.children.length; i++) {
                    selected.children[i].remove()
                }
                break
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
        exports.recordChange()
    }
}

function undo() {
    if (history.length === 0 && JSON.stringify(character) === oldcharacter) return
    reverseHistory.push(history.pop())
    let action = history.length === 0 ? oldcharacter : history[history.length - 1]
    let emote = puppet.emote
    exports.setPuppet(JSON.parse(action), true, true)
    document.getElementById('editor-emote').value = puppet.emotes[emote].name
    puppet.changeEmote(emote)
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
