// Imports
const remote = require('electron').remote
const windowStateKeeper = require('electron-window-state')
const BrowserWindow = remote.BrowserWindow
const application = require('./application.js')
const editor = require('./editor.js')
const network = require('./network.js')
const status = require('./status.js')
const Stage = require('./stage.js').Stage
const fs = require('fs-extra')
const path = require('path')
const url = require('url')

// Vars
let project
let stage
let puppet
let character
let hotbar = []
let popout
let popoutWindowState

exports.init = function() {
	status.init()
	status.log('Loading project...', 1, 1)
	project = remote.getGlobal('project').project
	application.init()
	network.init()
	stage = new Stage('screen', project.project, project.assets, project.assetsPath, loadPuppets, status.log)
	popoutWindowState = windowStateKeeper({
		file: "popout-window.json",
	    defaultWidth: 800,
	    defaultHeight: 600
	})
}

exports.setPuppetLocal = function(index, shiftKey, ctrlKey) {
	if (!hotbar[index]) return

	let newPuppet
	let oldcharacter = character
	character = JSON.parse(JSON.stringify(project.characters[project.project.hotbar[index]]))

	if (shiftKey && !ctrlKey) {
		character.head = oldcharacter.head
		character.hat = oldcharacter.hat
		character.emotes = oldcharacter.emotes
		character.mouths = oldcharacter.mouths
		character.eyes = oldcharacter.eyes
		newPuppet = stage.createPuppet(character)
	} else if (!shiftKey && ctrlKey) {
		character.body = oldcharacter.body
		character.props = oldcharacter.props
		newPuppet = stage.createPuppet(character)
	} else {
		newPuppet = hotbar[index]
	}

	// Set Puppet
	stage.setPuppet(puppet.id, newPuppet)
	puppet = newPuppet

	// Update Editor
	application.setPuppet(index, puppet.emotes)

	// Update Project
	project.actor.id = project.project.hotbar[index]

	// Update Server
	network.emit('set puppet', puppet.id, project.getPuppet())

	// Update popout
	if (popout) popout.webContents.send('set puppet', puppet.id, project.project.hotbar[index])
}

exports.setEmoteLocal = function(emote) {
	// Change Emote
	exports.setEmote(puppet.id, emote)

	// Update Editor
	application.setEmote(puppet.emote)

	// Update Project
	project.actor.emote = emote

	// Update Server
	network.emit('set emote', puppet.id, emote)
}

exports.moveLeftLocal = function() {
	// Move Left
	exports.moveLeft(puppet.id)

	// Update Project
	project.actor.facingLeft = puppet.facingLeft
	project.actor.position = ((puppet.target % (project.project.numCharacters + 1)) + (project.project.numCharacters + 1)) % (project.project.numCharacters + 1)

	// Update Server
	network.emit('move left', puppet.id)
}

exports.moveRightLocal = function() {
	// Move Right
	exports.moveRight(puppet.id)

	// Update Project
	project.actor.facingLeft = puppet.facingLeft
	project.actor.position = puppet.target % (project.project.numCharacters + 1)

	// Update Server
	network.emit('move right', puppet.id)
}

exports.startBabblingLocal = function() {
	// Start Babbling
	exports.startBabbling(puppet.id)

	// Update Editor
	application.setBabble(true)

	// Update Server
	network.emit('start babbling', puppet.id)
}

exports.stopBabblingLocal = function() {
	// Stop Babbling
	exports.stopBabbling(puppet.id)

	// Update Editor
	application.setBabble(false)

	// Update Server
	network.emit('stop babbling', puppet.id)
}

exports.jiggleLocal = function() {
	// Stop Babbling
	exports.jiggle(puppet.id)

	// Update Server
	network.emit('jiggle', puppet.id)
}

exports.setPuppet = function(id, puppet) {
	// Set Puppet
	stage.setPuppet(id, stage.createPuppet(puppet))

	// Update popout
	if (popout) popout.webContents.send('set puppet', id, puppet)
}

exports.setEmote = function(id, emote) {
	// Change Emote
	stage.getPuppet(id).changeEmote(emote)

	// Update popout
	if (popout) popout.webContents.send('set emote', id, emote)
}

exports.moveLeft = function(id) {
	let puppet = stage.getPuppet(id)

	// Move Left
	puppet.moveLeft()

	// Update popout
	if (popout) popout.webContents.send('move left', id)

	return puppet
}

exports.moveRight = function(id) {
	let puppet = stage.getPuppet(id)

	// Move Right
	puppet.moveRight()

	// Update popout
	if (popout) popout.webContents.send('move right', id)

	return puppet
}

exports.startBabbling = function(id) {
	// Start Babbling
	stage.getPuppet(id).setBabbling(true)

	// Update popout
	if (popout) popout.webContents.send('start babbling', id)
}

exports.stopBabbling = function(id) {
	// Stop Babbling
	stage.getPuppet(id).setBabbling(false)

	// Update popout
	if (popout) popout.webContents.send('stop babbling', id)
}

exports.jiggle = function(id) {
	// Jiggle
	stage.getPuppet(id).jiggle();

	// Update popout
	if (popout) popout.webContents.send('jiggle', id)
}

exports.togglePopout = function() {
	if (popout) popIn()
	else popOut()
}

exports.emitPopout = function(...args) {
	if (popout) popout.webContents.send(...args)
}

exports.setupPopout = function() {
	exports.emitPopout('setup', project, project.getPuppet(), puppet.id)
}

exports.resize = function() {
	stage.resize()
	exports.emitPopout('resize')
}

exports.updateHotbar = function(i, puppet) {
	project.project.hotbar[i] = parseInt(puppet)
	if (puppet === '') {
		hotbar[i] = null
	} else {
		hotbar[i] = stage.createPuppet(project.characters[puppet])
	}
}

exports.addAsset = function(asset) {
	exports.addAssetLocal(asset)
	network.emit('add asset', asset)
}

exports.addAssetLocal = function(asset) {
	project.addAsset(asset)
	stage.addAsset(asset)
	editor.addAsset(asset.tab, asset.hash)
	exports.emitPopout('add asset', asset)
}

exports.moveAsset = function(tab, asset, newTab) {
	exports.moveAssetLocal(tab, asset, newTab)
	network.emit('move asset', tab, asset, newTab)
}

exports.moveAssetLocal = function(tab, asset, newTab) {
    status.log("Moving asset to " + newTab + " list...", 2, 1)
	editor.migrateAsset(tab, asset, newTab)
	project.moveAsset(tab, asset, newTab)
	stage.addAsset({"tab": newTab, "hash": asset, "name": project.assets[newTab][asset].name})
    let characters = Object.keys(project.characters)
    for (let i = 0; i < characters.length; i++) {
    	let character = project.characters[characters[i]]
    	let topLevel = ["body", "head", "hat", "props"]
    	for (let j = 0; j < topLevel.length; j++)
	        for (let k = 0; k < character[topLevel[j]].length; k++)
	        	if (character[topLevel[j]][k].tab === tab && character[topLevel[j]][k].hash === asset)
	        		character[topLevel[j]][k].tab = newTab
	    let emotes = Object.keys(character.emotes)
	    for (let j = 0; j < emotes.length; j++) {
	    	for (let k = 0; k < character.emotes[emotes[j]].eyes.length; k++)
	    		if (character.emotes[emotes[j]].eyes[k].tab === tab && character.emotes[emotes[j]].eyes[k].hash === asset)
	    			character.emotes[emotes[j]].eyes[k].tab = newTab
	    	for (let k = 0; k < character.emotes[emotes[j]].mouth.length; k++)
	    		if (character.emotes[emotes[j]].mouth[k].tab === tab && character.emotes[emotes[j]].mouth[k].hash === asset)
	    			character.emotes[emotes[j]].mouth[k].tab = newTab
	    }
	    exports.saveCharacter(character)
    }
    status.log("Moved asset!", 1, 1)
}

exports.deleteAsset = function(tab, asset) {
	exports.deleteAssetLocal(tab, asset)
	network.emit('delete asset', tab, asset)
}

exports.deleteAssetLocal = function(tab, asset) {
    status.log("Deleting asset...", 2, 1)
	editor.deleteAsset(tab, asset)
	project.deleteAsset(tab, asset)
    let characters = Object.keys(project.characters)
    for (let i = 0; i < characters.length; i++) {
    	let character = project.characters[characters[i]]
    	let topLevel = ["body", "head", "hat", "props"]
    	for (let j = 0; j < topLevel.length; j++)
	        for (let k = 0; k < character[topLevel[j]].length; k++)
	        	if (character[topLevel[j]][k].tab === tab && character[topLevel[j]][k].hash === asset)
	        		character[topLevel[j]].splice(k, 1)
	    let emotes = Object.keys(character.emotes)
	    for (let j = 0; j < emotes.length; j++) {
	    	for (let k = 0; k < character.emotes[emotes[j]].eyes.length; k++) 
	    		if (character.emotes[emotes[j]].eyes[k].tab === tab && character.emotes[emotes[j]].eyes[k].hash === asset)
                    character.emotes[emotes[j]].eyes.splice(k, 1)
	    	for (let k = 0; k < character.emotes[emotes[j]].mouth.length; k++)
	    		if (character.emotes[emotes[j]].mouth[k].tab === tab && character.emotes[emotes[j]].mouth[k].hash === asset)
                    character.emotes[emotes[j]].mouth.splice(k, 1)
	    }
	    exports.saveCharacter(project.characters[characters[i]])
    }
    status.log("Deleted asset!", 1, 1)
}

exports.renameAssetList = function(tab, newTab) {
	exports.renameAssetListLocal(tab, newTab)
	network.emit('rename asset list', tab, newTab)
}

exports.renameAssetListLocal = function(tab, newTab) {
	editor.renameAssetList(tab, newTab)
	project.renameAssetList(tab, newTab)
    let characters = Object.keys(project.characters)
    for (let i = 0; i < characters.length; i++) {
    	let character = project.characters[characters[i]]
    	let topLevel = ["body", "head", "hat", "props"]
    	for (let j = 0; j < topLevel.length; j++)
	        for (let k = 0; k < character[topLevel[j]].length; k++)
	        	if (character[topLevel[j]][k].tab === tab)
	        		character[topLevel[j]][k].tab = newTab
	    let emotes = Object.keys(character.emotes)
	    for (let j = 0; j < emotes.length; j++) {
	    	for (let k = 0; k < character.emotes[emotes[j]].eyes.length; k++)
	    		if (character.emotes[emotes[j]].eyes[k].tab === tab)
	    			character.emotes[emotes[j]].eyes[k].tab = newTab
	    	for (let k = 0; k < character.emotes[emotes[j]].mouth.length; k++)
	    		if (character.emotes[emotes[j]].mouth[k].tab === tab)
	    			character.emotes[emotes[j]].mouth[k].tab = newTab
	    }
	    exports.saveCharacter(project.characters[characters[i]])
    }
}

exports.deleteAssetList = function(tab) {
	exports.deleteAssetListLocal(tab)
	network.emit('delete asset list', tab)
}

exports.deleteAssetListLocal = function(tab) {
	let keys = Object.keys(project.assets[tab])
    for (let i = 0; i < keys.length; i++) {
        exports.deleteAsset(tab, keys[i])
    }
    project.deleteAssetList(tab)
    editor.deleteAssetList(tab)
}

exports.deleteCharacter = function(character) {
	let index = project.project.hotbar.indexOf(character.id)
	if (index > -1) {
		hotbar[index] = null
		project.project.hotbar[index] = parseInt('')
		application.deleteCharacter(index)
	}
}

exports.updateCharacter = function(index, character) {
	hotbar[index] = stage.createPuppet(character)
}

exports.saveCharacter = function(character, thumbnail) {
    project.saveCharacter(character)
	if (thumbnail) {
		fs.ensureDirSync(path.join(project.assetsPath, '..', 'thumbnails'))
		fs.writeFile(path.join(project.assetsPath, '..', 'thumbnails', 'new-' + character.id + '.png'), new Buffer(thumbnail, 'base64'), (err) => {
	        if (err) console.log(err)
	        application.updateCharacter(character, true)
	    })
	} else {
		application.updateCharacter(character)
	}    
}

exports.connect = function() {
    stage.clearPuppets()
	if (popout) popout.webContents.send('connect')
}

exports.disconnect = function() {
	stage.clearPuppets()
	puppet = stage.addPuppet(project.getPuppet(), 1)
	character = JSON.parse(JSON.stringify(project.getPuppet()))
	if (popout) popout.webContents.send('disconnect', project.getPuppet())
}

exports.host = function() {
	if (popout) {
		popout.webContents.send('connect')
		popout.webContents.send('assign puppet', project.getPuppet())
	}
}

exports.assign = function(id) {
	puppet = stage.addPuppet(project.getPuppet(), id)
	character = JSON.parse(JSON.stringify(project.getPuppet()))
	if (popout) popout.webContents.send('assign puppet', project.getPuppet(), id)
}

exports.addPuppet = function(puppet) {
	stage.addPuppet(puppet, puppet.charId)
	if (popout) popout.webContents.send('add puppet', puppet)
}

exports.removePuppet = function(id) {
	stage.removePuppet(id)
	if (popout) popout.webContents.send('remove puppet', id)
}

exports.getThumbnail = function() {
	return stage.getThumbnail()
}

function loadPuppets(stage) {
	status.log('Loading puppets...', 2, 1)

	// Add Puppet
	puppet = stage.addPuppet(project.getPuppet(), 1)
	character = JSON.parse(JSON.stringify(project.getPuppet()))

	// Puppet Editor
	editor.init()
	stage.registerPuppetListener('mousedown', (e) => {
		editor.setPuppet(JSON.parse(project.duplicateCharacter(e.target.puppet)))
	})

	// Create Hotbar Puppets
	for (let i = 0; i < project.project.hotbar.length; i++) {
		if (project.project.hotbar[i] !== '' && project.project.hotbar[i] > 0)
			hotbar[i] = stage.createPuppet(project.characters[project.project.hotbar[i]])
	}

	// Update editor
	application.setPuppet(project.project.hotbar.indexOf(project.actor.id), puppet.emotes)
	application.setEmote(puppet.emote)

	status.log('Project Loaded!', 1, 1)
}

function popIn() {
	popout.close()
}

function popOut() {
	popout = new BrowserWindow({
	    x: popoutWindowState.x,
	    y: popoutWindowState.y,
	    width: popoutWindowState.width,
	    height: popoutWindowState.height,
		frame: false, 
		parent: remote.getCurrentWindow(), 
		icon: path.join(__dirname, 'assets', 'icons', 'icon.ico'), 
		backgroundColor: project.project.greenScreen, 
		alwaysOnTop: project.project.alwaysOnTop
	})
	popoutWindowState.manage(popout)
	// popout.setIgnoreMouseEvents(true)
	popout.on('close', () => {
		application.closePopout()
		stage.reattach('screen')
		popout = null
	})
	popout.loadURL(url.format({
		pathname: path.join(__dirname, '../popout.html'),
		protocol: 'file:',
		slashes: true
	  }))
	application.openPopout()
}
