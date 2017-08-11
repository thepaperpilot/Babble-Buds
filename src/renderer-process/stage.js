// imports
const PIXI = require('pixi.js')
const path = require('path')

// Constants
const MOVE_DURATION = 0.75 // in seconds

// Aliases
let Container = PIXI.Container,
    autoDetectRenderer = PIXI.autoDetectRenderer,
    loader = PIXI.loader,
    Sprite = PIXI.Sprite,
    TextureCache = PIXI.utils.TextureCache

// Exports
exports.Stage = Stage

function Stage(element, project, assets, assetsPath, callback) {
    this.project = project
    this.assets = assets
    this.assetsPath = assetsPath

    // Create some basic objects
    this.stage = new Container()
    this.puppetStage = new Container()
    this.stage.addChild(this.puppetStage)
    this.renderer = autoDetectRenderer(1, 1, {transparent: true})
    this.screen = document.getElementById(element)
    this.screen.appendChild(this.renderer.view)
    
    this.lastFrame = new Date()
    this.puppets = []
    this.listeners = []

    // Make the game fit the entire window
    this.renderer.view.style.position = "absolute";
    this.renderer.view.style.display = "block";
    this.renderer.autoResize = true;

    // Load Assets
    let texturesToLoad = false
    for (let i = 0; i < project.assets.length; i++) {
        let tab = assets[project.assets[i].name]
        let keys = Object.keys(tab)
        for (let j = 0; j < keys.length; j++) {
            if (!TextureCache[path.join(assetsPath, tab[keys[j]].location)]) {
                loader.add(path.join(assetsPath, tab[keys[j]].location))
                texturesToLoad = true
            }
        }
    }
    let stage = this
    if (texturesToLoad) {
        loader.onComplete.add(function() { 
            stage.resize()
            window.addEventListener("resize", stage.resize.bind(stage))
            if (callback) callback(stage)
            stage.gameLoop()
        })
        loader.load()
    } else {
        loader.load()
        stage.resize()
        window.addEventListener("resize", stage.resize.bind(stage))
        if (callback) callback(stage)
        stage.gameLoop()
    }
}

Stage.prototype.registerPuppetListener = function(event, callback) {
    this.listeners.push({"event": event, "callback": callback})
    for (let i = 0; i < this.puppets.length; i++)
        this.puppets[i].container.on(event, callback)
}

Stage.prototype.addAsset = function(asset) {
    if (!this.assets[asset.tab])
        this.assets[asset.tab] = {}
    this.assets[asset.tab][asset.hash] = {"name": asset.name, "location": path.join(asset.tab, asset.hash + '.png')}
    TextureCache[path.join(this.assetsPath, this.assets[asset.tab][asset.hash].location)] = PIXI.Texture.fromImage(path.join(this.assetsPath, this.assets[asset.tab][asset.hash].location))
}

Stage.prototype.reattach = function(element) {
    this.screen = document.getElementById(element)
    this.screen.appendChild(this.renderer.view)
    this.resize()
}

Stage.prototype.resize = function() {
    this.renderer.resize(this.screen.clientWidth, this.screen.clientHeight)
    this.slotWidth = this.screen.clientWidth / this.project.numCharacters
    if (this.slotWidth < 400) {
        this.puppetStage.scale.x = this.puppetStage.scale.y = this.slotWidth / 400
        this.slotWidth = 400
    } else this.puppetStage.scale.x = this.puppetStage.scale.y = 1
    for (let i = 0; i < this.puppets.length; i++) {
        let puppet = this.puppets[i]
        if (puppet.position > this.project.numCharacters + 1 || puppet.target > this.project.numCharacters + 1) {
            puppet.position = puppet.target = this.project.numCharacters + 1
            puppet.movingAnim = 0
        }
        puppet.container.scale.x = puppet.container.scale.y = (this.project.puppetScale || 1)
        puppet.container.y = this.screen.clientHeight / this.puppetStage.scale.y
        puppet.container.x = (puppet.position - 0.5) * this.slotWidth
    }
}

Stage.prototype.createPuppet = function(obj) {
    return new Puppet(this, obj, -1)
}

Stage.prototype.addPuppet = function(obj, id) {
    let puppet = new Puppet(this, obj, id)
    this.puppets.push(puppet)
    this.puppetStage.addChild(puppet.container)
    for (let i = 0; i < this.listeners.length; i++)
        puppet.container.on(this.listeners[i].event, this.listeners[i].callback)
    puppet.container.y = this.screen.clientHeight / this.puppetStage.scale.y
    puppet.container.x = (puppet.position - 0.5) * this.slotWidth
    return puppet
}

Stage.prototype.removePuppet = function(id) {
    let puppet
    for (let i = 0; i < this.puppets.length; i++)
        if (this.puppets[i].id == id) {
            puppet = this.puppets[i]
            break
        }
    if (puppet) {
        this.puppets.splice(this.puppets.indexOf(puppet), 1)
        this.puppetStage.removeChild(puppet.container)
    }
}

Stage.prototype.clearPuppets = function() {
    while (this.puppets.length !== 0) {
        this.puppetStage.removeChild(this.puppets[0].container)
        this.puppets.splice(0, 1)
    }
}

Stage.prototype.getPuppet = function(id) {
    for (let i = 0; i < this.puppets.length; i++)
        if (this.puppets[i].id == id)
            return this.puppets[i]
}

Stage.prototype.setPuppet = function(id, newPuppet) {
    let oldPuppet = this.getPuppet(id)
    newPuppet.changeEmote(oldPuppet.emote)
    newPuppet.id = oldPuppet.id
    newPuppet.position = oldPuppet.position
    newPuppet.target = oldPuppet.target
    newPuppet.facingLeft = oldPuppet.facingLeft
    newPuppet.container.scale.x = newPuppet.facingLeft ? -1 : 1

    for (let i = 0; i < this.listeners.length; i++)
        newPuppet.container.on(this.listeners[i].event, this.listeners[i].callback)
    newPuppet.container.y = this.screen.clientHeight / this.puppetStage.scale.y
    newPuppet.container.x = (newPuppet.position - 0.5) * this.slotWidth

    this.puppets[this.puppets.indexOf(oldPuppet)] = newPuppet
    this.puppetStage.removeChild(oldPuppet.container)
    this.puppetStage.addChild(newPuppet.container)
    this.resize()
}

Stage.prototype.getThumbnail = function() {
    this.renderer.render(this.stage)
    return this.renderer.view.toDataURL().replace(/^data:image\/\w+;base64,/, "")
}

Stage.prototype.gameLoop = function() {
    let thisFrame = new Date()
    let delta = thisFrame - this.lastFrame
    this.lastFrame = thisFrame

    requestAnimationFrame(this.gameLoop.bind(this))
    for (let i = 0; i < this.puppets.length; i++) {
        let puppet = this.puppets[i]
        // Movement animations
        // I've tried to emulate what puppet pals does as closely as possible
        // But frankly it's difficult to tell
        if (puppet.target != puppet.position || puppet.movingAnim !== 0) {
            // Whether its going left or right
            let direction = puppet.target > puppet.position ? 1 : -1
            // Update how far into the animation we are
            puppet.movingAnim += delta / (1000 * MOVE_DURATION)

            // We want to do a bit of animation when they arrive at the target slot. 
            //  in order to do that we have part of the animation (0 - .6) be for each slot
            //  and the rest (.6 - 1) only plays at the destination slot
            if (puppet.movingAnim >= 0.6 && puppet.movingAnim - delta / (1000 * MOVE_DURATION) < 0.6) {
                // Once we pass .6, update our new slot position
                puppet.position += direction
                // If we're not at the final slot yet, reset the animation
                if (puppet.position != puppet.target) puppet.movingAnim = 0

            } else if (puppet.movingAnim >= 1) puppet.movingAnim = 0

            // Scale in a sin formation such that it does 3 half circles per slot, plus 2 more at the end
            puppet.container.scale.y = 1 + Math.sin((1 + puppet.movingAnim * 5) * Math.PI) / 40
            // Update y value so it doesn't leave the bottom of the screen while bouncing
            puppet.container.y = this.screen.clientHeight / this.puppetStage.scale.y
            // Linearly move across the slot, unless we're in the (.6 - 1) part of the animation
            puppet.container.x = (puppet.position + direction * (puppet.movingAnim >= 0.6 ? 0 : puppet.movingAnim / 0.6) - 0.5) * this.slotWidth

            // Wrap Edges
            if (puppet.target > this.project.numCharacters + 1 && puppet.position >= this.project.numCharacters + 1 && puppet.movingAnim > 0) {
                puppet.container.x -= (this.project.numCharacters + 1) * this.slotWidth
                puppet.position = 0
                puppet.target -= this.project.numCharacters + 1
            }
            if (puppet.target < 0 && puppet.position <= 0 && puppet.movingAnim > 0) {
                puppet.container.x += (this.project.numCharacters + 1) * this.slotWidth
                puppet.position = this.project.numCharacters + 1
                puppet.target += this.project.numCharacters + 1
            }
        }
        if (puppet.babbling) {
            // Update how long each face part has been on display
            puppet.eyesAnim += delta
            puppet.mouthAnim += delta

            // Update eyes
            if (puppet.eyesAnim >= puppet.eyesDuration && puppet.eyes.length && (puppet.emote === 'default' || !puppet.emotes[puppet.emote])) {
                if (puppet.emotes[puppet.emote]) puppet.emotes[puppet.emote].eyes.visible = false
                puppet.emotes['default'].eyes.visible = false
                for (let j = 0; j < puppet.eyes.length; j++) {
                    if (puppet.emotes[puppet.eyes[j]]) puppet.emotes[puppet.eyes[j]].eyes.visible = false
                }
                let eyes = puppet.eyes[Math.floor(Math.random() * puppet.eyes.length)]
                puppet.emotes[puppet.emotes[eyes] ? eyes : 'default'].eyes.visible = true
                puppet.eyesAnim = 0
                puppet.eyesDuration = Math.random() * 2000 + 200
            }

            // Update mouth
            if (puppet.mouthAnim >= puppet.mouthDuration && puppet.mouths.length) {
                if (puppet.emotes[puppet.emote]) puppet.emotes[puppet.emote].mouth.visible = false
                puppet.emotes['default'].mouth.visible = false
                for (let j = 0; j < puppet.mouths.length; j++) {
                    if (puppet.emotes[puppet.mouths[j]]) puppet.emotes[puppet.mouths[j]].mouth.visible = false
                }
                let mouth = puppet.mouths[Math.floor(Math.random() * puppet.mouths.length)]
                puppet.emotes[puppet.emotes[mouth] ? mouth : 'default'].mouth.visible = true
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
        if (puppet.deadbonesStyle && (puppet.babbling || puppet.deadbonesDuration !== 0)) {
            puppet.deadbonesAnim += delta
            if (puppet.deadbonesAnim >= puppet.deadbonesDuration) {
                puppet.deadbonesAnim = 0
                if (puppet.babbling) {
                    puppet.deadbonesDuration = 100 + Math.random() * 200
                    puppet.deadbonesStartY = puppet.head.y = puppet.deadbonesTargetY
                    puppet.deadbonesStartRotation = puppet.head.rotation = puppet.deadbonesTargetRotation
                    puppet.deadbonesTargetY = Math.random() * - 20 - puppet.headBase.height / 2
                    puppet.deadbonesTargetRotation = 0.1 - Math.random() * 0.2
                } else {
                    puppet.deadbonesDuration = 0
                    puppet.head.y = puppet.deadbonesTargetY
                    puppet.head.rotation = puppet.deadbonesTargetRotation
                }
            } else {
                let percent = (puppet.deadbonesAnim / puppet.deadbonesDuration) * (puppet.deadbonesAnim / puppet.deadbonesDuration)
                puppet.head.y = puppet.deadbonesStartY + (puppet.deadbonesTargetY - puppet.deadbonesStartY) * percent
                puppet.head.rotation = puppet.deadbonesStartRotation + (puppet.deadbonesTargetRotation - puppet.deadbonesStartRotation) * percent
            }
        }
    }
    this.renderer.render(this.stage)
}

Stage.prototype.getAsset = function(asset, layer) {
    let sprite = new Sprite(TextureCache[path.join(this.assetsPath, this.assets[asset.tab][asset.hash].location)])
    sprite.anchor.set(0.5)
    sprite.x = asset.x
    sprite.y = asset.y
    sprite.rotation = asset.rotation
    sprite.scale.x = asset.scaleX
    sprite.scale.y = asset.scaleY
    sprite.layer = layer
    sprite.asset = asset
    return sprite
}

// Puppet Prototype
let Puppet = function(stage, puppet, id) {
    // Init Variables
    this.babbling = false
    this.stage = stage
    this.id = id
    this.name = puppet.name
    this.container = new Container()
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
    for (let i = 0; i < puppet.body.length; i++) {
        this.body.addChild(stage.getAsset(puppet.body[i], 'body'))
    }
    this.container.addChild(this.body)

    this.head = new Container()
    this.headBase = new Container()
    for (let i = 0; i < puppet.head.length; i++) {
        this.headBase.addChild(stage.getAsset(puppet.head[i], 'headBase'))
    }
    this.head.addChild(this.headBase)
    this.emotes = {}
    this.mouthsContainer = new Container()
    this.eyesContainer = new Container()
    let emotes = Object.keys(puppet.emotes)
    for (let i = 0; i < emotes.length; i++) {
        if (!puppet.emotes[emotes[i]].enabled) continue
        this.emotes[emotes[i]] = {
            "mouth": new Container(),
            "eyes": new Container()
        }
        this.mouthsContainer.addChild(this.emotes[emotes[i]].mouth)
        this.eyesContainer.addChild(this.emotes[emotes[i]].eyes)
        for (let j = 0; j < puppet.emotes[emotes[i]].mouth.length; j++) {
            this.emotes[emotes[i]].mouth.addChild(stage.getAsset(puppet.emotes[emotes[i]].mouth[j], emotes[i] + '-emote'))
        }
        for (let j = 0; j < puppet.emotes[emotes[i]].eyes.length; j++) {
            this.emotes[emotes[i]].eyes.addChild(stage.getAsset(puppet.emotes[emotes[i]].eyes[j], emotes[i] + '-emote'))
        }
    }
    this.head.addChild(this.mouthsContainer)
    this.head.addChild(this.eyesContainer)
    this.hat = new Container()
    for (let i = 0; i < puppet.hat.length; i++) {
        this.hat.addChild(stage.getAsset(puppet.hat[i], 'hat'))
    }
    this.head.addChild(this.hat)
    this.head.pivot.y = - this.headBase.height / 2
    this.head.y = - this.headBase.height / 2
    this.deadbonesTargetY = this.deadbonesStartY = - this.headBase.height / 2
    this.container.addChild(this.head)

    this.props = new Container()
    for (let i = 0; i < puppet.props.length; i++) {
        this.props.addChild(stage.getAsset(puppet.props[i], 'props'))
    }
    this.container.addChild(this.props)

    // Finish Setup
    this.changeEmote(puppet.emote)

    // Place Puppet on Stage
    this.container.interactive = true
    this.container.puppet = puppet
    this.container.y = stage.screen.clientHeight / stage.puppetStage.scale.y
    this.container.x = (this.position - 0.5) * stage.slotWidth
    if (this.facingLeft) this.container.scale.x = -1
}

Puppet.prototype.changeEmote = function (emote) {
    this.emote = emote
    let emotes = Object.keys(this.emotes)
    for (let i = 0; i < emotes.length; i++) {
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
    if (this.facingLeft || this.position === 0 || this.position == this.stage.project.numCharacters + 1) {
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
    if (!this.facingLeft || this.position === 0 || this.position == this.stage.project.numCharacters + 1) {
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
            this.deadbonesTargetY = - this.headBase.height / 2
            this.deadbonesTargetRotation = 0
            this.deadbonesStartY = this.head.y
            this.deadbonesStartRotation = this.head.rotation
        }
    }
}

Puppet.prototype.jiggle = function() {
    if (this.movingAnim === 0) this.movingAnim = 0.6
}

Puppet.prototype.addEmote = function(emote) {
    if (this.emotes[emote]) return
    this.emotes[emote] = {
        "mouth": new Container(),
        "eyes": new Container()
    }
    this.mouthsContainer.addChild(this.emotes[emote].mouth)
    this.eyesContainer.addChild(this.emotes[emote].eyes)
}
