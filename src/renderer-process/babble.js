// imports
const PIXI = require('pixi.js')
const path = require('path')

// Constants
const MOVE_DURATION = .75 // in seconds

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

// vars
var project // settings
var assets // images
var assetsPath
var slotWidth // Width of each puppet slot
var puppets = [] // Puppets on screen
var stage // pixi stage
var renderer // pixi renderer
var screen // element on webpage where stage is

// Exports
exports.init = function(element, proj, imgs, assetspath, callback) {
    project = proj
    assets = imgs
    assetsPath = assetspath

    // Create some basic objects
    stage = new Container();
    renderer = autoDetectRenderer(1, 1, {antialias: true, transparent: true});
    screen = document.getElementById(element)
    screen.appendChild(renderer.view);

    // Make the game fit the entire window
    renderer.view.style.position = "absolute";
    renderer.view.style.display = "block";
    renderer.autoResize = true;

    // Load Assets
    for (var i = 0; i < project.assets.length; i++) {
        var tab = assets[project.assets[i].name]
        var keys = Object.keys(tab)
        for (var j = 0; j < keys.length; j++) {
            loader.add(path.join(assetsPath, tab[keys[j]].location))
        }
    }
    loader.load(function() { if (callback) callback(); setup(); })
}

exports.addAsset = function(tab, asset) {
    if (!assets[tab])
        assets[tab] = {}
    assets[tab][asset] = {"location": path.join(tab, asset + '.png')}
    TextureCache[path.join(assetsPath, assets[tab][asset].location)] = PIXI.Texture.fromImage(path.join(assetsPath, assets[tab][asset].location))
}

exports.reattach = function(element) {
    screen = document.getElementById(element)
    screen.appendChild(renderer.view)
    exports.resize()
}

exports.resize = function() {
    renderer.resize(screen.clientWidth, screen.clientHeight)
    slotWidth = screen.clientWidth / project.numCharacters
    if (slotWidth < project.minSlotWidth) {
        stage.scale.x = stage.scale.y = slotWidth / project.minSlotWidth
        slotWidth = project.minSlotWidth
    } else stage.scale.x = stage.scale.y = 1
    for (var i = 0; i < puppets.length; i++) {
        puppets[i].container.y = screen.clientHeight / stage.scale.y - puppets[i].body.height / 2
        puppets[i].container.x = (puppets[i].position - .5) * slotWidth
    }
}

exports.createPuppet = function(obj) {
    return new Puppet(obj, -1)
}

exports.addPuppet = function(obj, id) {
    var puppet = new Puppet(obj, id)
    puppets.push(puppet)
    stage.addChild(puppet.container)
    puppet.container.y = screen.clientHeight / stage.scale.y - puppet.body.height / 2
    puppet.container.x = (puppet.position - .5) * slotWidth
    return puppet
}

exports.removePuppet = function(id) {
    var puppet
    for (var i = 0; i < puppets.length; i++)
        if (puppets[i].id == id) {
            puppet = puppets[i]
            break
        }
    if (puppet) {
        puppets.splice(puppets.indexOf(puppet), 1)
        stage.removeChild(puppet.container)
    }
}

exports.clearPuppets = function() {
    while (puppets.length != 0) {
        stage.removeChild(puppets[0].container)
        puppets.splice(0, 1)
    }
}

exports.getPuppet = function(id) {
    for (var i = 0; i < puppets.length; i++)
        if (puppets[i].id == id)
            return puppets[i]
}

exports.setPuppet = function(id, newPuppet) {
    var oldPuppet = exports.getPuppet(id)
    newPuppet.changeEmote(oldPuppet.emote)
    newPuppet.id = oldPuppet.id
    newPuppet.position = oldPuppet.position
    newPuppet.target = oldPuppet.target
    newPuppet.facingLeft = oldPuppet.facingLeft
    newPuppet.container.scale.x = newPuppet.facingLeft ? -1 : 1

    newPuppet.container.y = screen.clientHeight / stage.scale.y - newPuppet.body.height / 2
    newPuppet.container.x = (newPuppet.position - .5) * slotWidth

    puppets[puppets.indexOf(oldPuppet)] = newPuppet
    stage.removeChild(oldPuppet.container)
    stage.addChild(newPuppet.container)
}

// Setup
function setup() {
    exports.resize()
    window.addEventListener("resize", exports.resize)
    gameLoop()
}

// Game Loop
var lastFrame = new Date()
function gameLoop() {
    var thisFrame = new Date()
    var delta = thisFrame - lastFrame
    lastFrame = thisFrame

    requestAnimationFrame(gameLoop)
    for (var i = 0; i < puppets.length; i++) {
        var puppet = puppets[i]
        // Movement animations
        // I've tried to emulate what puppet pals does as closely as possible
        // But frankly it's difficult to tell
        if (puppet.target != puppet.position || puppet.movingAnim != 0) {
            // Whether its going left or right
            var direction = puppet.target > puppet.position ? 1 : -1
            // Update how far into the animation we are
            puppet.movingAnim += delta / (1000 * MOVE_DURATION)

            // We want to do a bit of animation when they arrive at the target slot. 
            //  in order to do that we have part of the animation (0 - .6) be for each slot
            //  and the rest (.6 - 1) only plays at the destination slot
            if (puppet.movingAnim >= .6 && puppet.movingAnim - delta / (1000 * MOVE_DURATION) < .6) {
                // Once we pass .6, update our new slot position
                puppet.position += direction
                // If we're not at the final slot yet, reset the animation
                if (puppet.position != puppet.target) puppet.movingAnim = 0
            } else if (puppet.movingAnim >= 1) puppet.movingAnim = 0

            // Scale in a sin formation such that it does 3 half circles per slot, plus 2 more at the end
            puppet.container.scale.y = 1 + Math.sin((1 + puppet.movingAnim * 5) * Math.PI) / 80
            // Update y value so it doesn't leave the bottom of the screen while bouncing
            puppet.container.y = screen.clientHeight / stage.scale.y - puppet.body.height * puppet.container.scale.y / 2
            // Linearly move across the slot, unless we're in the (.6 - 1) part of the animation
            puppet.container.x = (puppet.position + direction * (puppet.movingAnim >= .6 ? 0 : puppet.movingAnim / .6) - .5) * slotWidth

            // Wrap Edges
            if (puppet.target > project.numCharacters + 1 && puppet.position >= project.numCharacters + 1 && puppet.movingAnim > 0) {
                puppet.container.x -= (project.numCharacters + 1) * slotWidth
                puppet.position = 0
                puppet.target -= project.numCharacters + 1
            }
            if (puppet.target < 0 && puppet.position <= 0 && puppet.movingAnim > 0) {
                puppet.container.x += (project.numCharacters + 1) * slotWidth
                puppet.position = project.numCharacters + 1
                puppet.target += project.numCharacters + 1
            }
        }
        if (puppet.babbling) {
            // Update how long each face part has been on display
            puppet.eyesAnim += delta
            puppet.mouthAnim += delta

            // Update eyes
            if (puppet.eyesAnim >= puppet.eyesDuration && puppet.eyes.length) {
                if (puppet.emotes[puppet.emote]) puppet.emotes[puppet.emote].eyes.visible = false
                for (var j = 0; j < puppet.eyes.length; j++) {
                    puppet.emotes[puppet.eyes[j]].eyes.visible = false
                }
                puppet.emotes[puppet.eyes[Math.floor(Math.random() * puppet.eyes.length)]].eyes.visible = true
                puppet.eyesAnim = 0
                puppet.eyesDuration = Math.random() * 2000 + 200
            }

            // Update mouth
            if (puppet.mouthAnim >= puppet.mouthDuration && puppet.mouths.length) {
                if (puppet.emotes[puppet.emote]) puppet.emotes[puppet.emote].mouth.visible = false
                for (var j = 0; j < puppet.mouths.length; j++) {
                    puppet.emotes[puppet.mouths[j]].mouth.visible = false
                }
                puppet.emotes[puppet.mouths[Math.floor(Math.random() * puppet.mouths.length)]].mouth.visible = true
                puppet.mouthAnim = 0
                puppet.mouthDuration = Math.random() * 200 + 50
                if (puppet.deadbonesStyle)
                    puppet.mouthDuration *= 20
            }
        }
        // Update DeadbonesStyle Babbling
        // I'm not sure what Puppet Pals does, but I'm pretty sure this isn't it
        // But I think this looks "close enough", and probably the best I'm going
        // to get without Rob actually telling people how Puppet Pals does it
        if (puppet.deadbonesStyle && (puppet.babbling || puppet.deadbonesDuration != 0)) {
            puppet.deadbonesAnim += delta
            if (puppet.deadbonesAnim >= puppet.deadbonesDuration) {
                puppet.deadbonesAnim = 0
                if (puppet.babbling) {
                    puppet.deadbonesDuration = 100 + Math.random() * 200
                    puppet.deadbonesStartY = puppet.head.y = puppet.deadbonesTargetY
                    puppet.deadbonesStartRotation = puppet.head.rotation = puppet.deadbonesTargetRotation
                    puppet.deadbonesTargetY = Math.random() * -20
                    puppet.deadbonesTargetRotation = .1 - Math.random() * .2
                } else {
                    puppet.deadbonesDuration = 0
                }
            } else {
                var percent = (puppet.deadbonesAnim / puppet.deadbonesDuration) * (puppet.deadbonesAnim / puppet.deadbonesDuration)
                puppet.head.y = puppet.deadbonesStartY + (puppet.deadbonesTargetY - puppet.deadbonesStartY) * percent
                puppet.head.rotation = puppet.deadbonesStartRotation + (puppet.deadbonesTargetRotation - puppet.deadbonesStartRotation) * percent
            }
        }
    }
    renderer.render(stage)
}

// Puppet Prototype
var Puppet = function(puppet, id) {
    // Init Variables
    this.babbling = false
    this.id = id
    this.name = puppet.name
    this.container = new Container()
    this.container.pivot.x = this.container.pivot.y = .5
    this.position = this.target = puppet.position
    this.facingLeft = puppet.facingLeft
    this.eyes = puppet.eyes
    this.mouths = puppet.mouths
    this.deadbonesStyle = puppet.deadbonesStyle
    this.movingAnim = this.eyesAnim = this.mouthAnim = this.deadbonesAnim = 0
    this.eyesDuration = this.mouthDuration = this.deadbonesDuration = 0
    this.deadbonesTargetY = this.deadbonesStartY = 0
    this.deadbonesTargetRotation = this.deadbonesStartRotation = 0

    // Construct Puppet
    this.body = new Container()
    for (var i = 0; i < puppet.body.length; i++) {
        this.body.addChild(getAsset(puppet.body[i]))
    }
    this.container.addChild(this.body)

    this.head = new Container()
    this.emotes = {}
    var emotes = Object.keys(puppet.emotes)
    for (var i = 0; i < emotes.length; i++) {
        this.emotes[emotes[i]] = {
            "mouth": new Container(),
            "eyes": new Container()
        }
        this.head.addChild(this.emotes[emotes[i]].mouth)
        this.head.addChild(this.emotes[emotes[i]].eyes)
        for (var j = 0; j < puppet.emotes[emotes[i]].mouth.length; j++) {
            this.emotes[emotes[i]].mouth.addChild(getAsset(puppet.emotes[emotes[i]].mouth[j]))
        }
        for (var j = 0; j < puppet.emotes[emotes[i]].eyes.length; j++) {
            this.emotes[emotes[i]].eyes.addChild(getAsset(puppet.emotes[emotes[i]].eyes[j]))
        }
    }
    this.hat = new Container()
    for (var i = 0; i < puppet.hat.length; i++) {
        this.hat.addChild(getAsset(puppet.hat[i]))
    }
    this.head.addChild(this.hat)
    this.container.addChild(this.head)

    this.props = new Container()
    for (var i = 0; i < puppet.props.length; i++) {
        this.props.addChild(getAsset(puppet.props[i]))
    }
    this.container.addChild(this.props)

    // Finish Setup
    this.changeEmote(puppet.emote)

    // Place Puppet on Stage
    this.container.y = screen.clientHeight / stage.scale.y - this.container.height / 2
    this.container.x = (this.position - .5) * slotWidth
    if (this.facingLeft) this.container.scale.x = -1
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

Puppet.prototype.moveLeft = function() {
    if (this.target > this.position) return
    if (this.facingLeft || this.position == 0 || this.position == project.numCharacters + 1) {
        this.target--
        this.facingLeft = true
        this.container.scale.x = -1
    } else {
        this.facingLeft = true
        this.container.scale.x = -1
    }
}

Puppet.prototype.moveRight = function() {
    if (this.target < this.position) return
    if (!this.facingLeft || this.position == 0 || this.position == project.numCharacters + 1) {
        this.target++
        this.facingLeft = false
        this.container.scale.x = 1
    } else {
        this.facingLeft = false
        this.container.scale.x = 1
    }
}

Puppet.prototype.setBabbling = function(babble) {
    // Babbling will be triggered by holding down a button,
    //  which could end up calling this function a bunch
    //  so only do anything if we're actually changing the value
    if (this.babbling == babble) return
    this.babbling = babble

    if (!babble) {
        this.changeEmote(this.emote)

        if (this.deadbonesStyle) {
            this.deadbonesAnim = 0
            this.deadbonesDuration = 100
            this.deadbonesTargetY = 0
            this.deadbonesTargetRotation = 0
            this.deadbonesStartY = this.head.y
            this.deadbonesStartRotation = this.head.rotation
        }
    }
}

// Load Asset
function getAsset(asset) {
    var sprite = new Sprite(TextureCache[path.join(assetsPath, assets[asset.tab][asset.name].location)])
    sprite.anchor.set(0.5)
    sprite.x = asset.x
    sprite.y = asset.y
    sprite.rotation = asset.rotation
    sprite.scale.x = sprite.scale.y = asset.scale
    return sprite
}
