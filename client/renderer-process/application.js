// This file is required by the application.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

// Imports
const electron = require('electron')
const modal = new (require('vanilla-modal').default)()
const editor = require('./editor.js')
const controller = require('./controller.js')
const network = require('./network.js')
const settings = electron.remote.require('./main-process/settings')
const path = require('path')
const fs = require('fs-extra')

let project
let view

exports.init = function() {
	project = electron.remote.getGlobal('project').project

	// Window input events
	window.onkeydown = keyDown
	window.onkeyup = keyUp
	window.onbeforeunload = beforeUnload

	// DOM listeners
	for (let i = 0; i < 9; i++) {
		let element = document.getElementById('char ' + i)
		element.i = i
		element.addEventListener('click', charClick)
		element.addEventListener('contextmenu', charContextMenu)
		if (project.project.hotbar[i]) {
			element.getElementsByClassName('desc')[0].innerHTML = project.characters[project.project.hotbar[i]].name
			element.style.backgroundImage = 'url(' + path.join(project.charactersPath, '..', 'thumbnails', project.project.hotbar[i] + '.png?random=' + new Date().getTime()).replace(/\\/g, '/') + ')'
		}
	}
	document.getElementById('char null').addEventListener('click', updateHotbar)
	document.getElementById('char null').puppet = ''
	document.getElementById('char search').addEventListener('keyup', updateCharSearch)
	document.getElementById('char search').addEventListener('search', updateCharSearch)
	document.getElementById('char selected').addEventListener('click', charSelectedClick)
	document.getElementById('greenscreen').addEventListener('click', toggleGreenScreen)
	for (let i = 0; i < 12; i++) {
		let element = document.getElementById(i)
		element.emote = i
		element.addEventListener('click', emoteClick)
	}
	document.getElementById('babble').addEventListener('mousedown', controller.startBabblingLocal)
	document.getElementById('babble').addEventListener('mouseup', controller.stopBabblingLocal)
	document.getElementById('popout').addEventListener('click', controller.togglePopout)
	document.getElementById('settings').addEventListener('click', toggleSettings)
	document.getElementById('multiplayer').addEventListener('click', toggleMultiplayer)
	document.getElementById('colorpicker').addEventListener('change', colorpickerChange)
	document.getElementById('alwaysontop').addEventListener('click', toggleAlwaysOnTop)
	document.getElementById('puppetscale').addEventListener('change', puppetscaleChange)
	document.getElementById('numslots').addEventListener('change', numslotsChange)
	document.getElementById('nickname').addEventListener('change', nicknameChange)
	document.getElementById('randomNickname').addEventListener('click', randomNickname)
	document.getElementById('ip').addEventListener('change', (e) => { project.project.ip = e.target.value })
	document.getElementById('port').addEventListener('change', (e) => { project.project.port = parseInt(e.target.value) })
	document.getElementById('banish').addEventListener('click', controller.banishLocal)
	document.getElementById('connect').addEventListener('click', network.connect)
	document.getElementById('joinRoom').addEventListener('click', network.join)
	document.getElementById('createRoom').addEventListener('click', network.create)
	document.getElementById('roomName').addEventListener('change', (e) => { project.project.roomName = e.target.value })
	document.getElementById('roomPassword').addEventListener('change', roomPasswordChange)
	document.getElementById('roomPasswordVisibility').addEventListener('click', togglePasswordVisibility)
	document.getElementById('roomPuppetscale').addEventListener('change', roomPuppetscaleChange)
	document.getElementById('roomNumslots').addEventListener('change', roomNumslotsChange)
	document.getElementById('autocrop-btn').addEventListener('click', startAutocrop)
	document.getElementById('prune-btn').addEventListener('click', pruneAssets)

	// Handle input events from popout
	electron.ipcRenderer.on('keyDown', (event, key) => {
		window.onkeydown({"keyCode": key})
	})
	electron.ipcRenderer.on('keyUp', (event, key) => {
		window.onkeyup({"keyCode": key})
	})
	electron.ipcRenderer.on('init', () => {
		controller.initPopout()
	})
	electron.ipcRenderer.on('save', () => {
		project.saveProject()
	})
	electron.ipcRenderer.on('close', () => {
		project.closeProject()
	})
	electron.ipcRenderer.on('view', (event, newView) => {
		exports.setView(newView)
	})
	electron.ipcRenderer.on('togglePopout', () => {
		controller.togglePopout()
	})
	electron.ipcRenderer.on('toggleInstructions', () => {
		exports.toggleModal("#instructions")
	})
	electron.ipcRenderer.on('toggleAbout', () => {
		exports.toggleModal("#about")
	})
	electron.ipcRenderer.on('autocrop', () => {
		openAutocrop()
	})
	electron.ipcRenderer.on('reload', () => {
		controller.reloadAssets()
	})
	electron.ipcRenderer.on('prune', () => {
		openPrune()
	})
	electron.ipcRenderer.on('loaded', controller.setupPopout)

	// Load settings values
	document.getElementById('colorpicker').value = project.project.greenScreen
	document.getElementById('alwaysontop').checked = project.project.alwaysOnTop
	document.getElementById('puppetscale').value = project.project.puppetScale
	document.getElementById('numslots').value = project.project.numCharacters
	document.getElementById('nickname').value = project.project.nickname
	document.getElementById('ip').value = project.project.ip
	document.getElementById('port').value = project.project.port
	document.getElementById('roomName').value = project.project.roomName
	document.getElementById('roomPassword').value = project.project.roomPassword
	document.getElementById('roomPuppetscale').value = project.project.roomPuppetScale
	document.getElementById('roomNumslots').value = project.project.roomNumCharacters
}

// Update UI when user selects a new puppet
// Specifically, tint the character in the hotbar,
//  and tint available emotes for this puppet
exports.setPuppet = function(i) {
	let available = document.getElementById('emotes').getElementsByClassName("available")
	while (available.length)
		available[0].classList.remove("available")

	let selected = document.getElementsByClassName("char selected")
	while (selected.length)
		selected[0].classList.remove("selected")
	
	let character = JSON.parse(JSON.stringify(project.characters[project.project.hotbar[i]]))
	for (let i = 0; i < character.emotes.length; i++) {
		document.getElementById(i).getElementsByClassName('desc')[0].innerHTML = character.emotes[i].name
		if (character.emotes[i].enabled) {
			document.getElementById(i).className += " available"
			if (fs.existsSync(path.join(project.charactersPath, '..', 'thumbnails', "new-" + character.id, i + '.png')))
				document.getElementById(i).style.backgroundImage = 'url(' + path.join(project.charactersPath, '..', 'thumbnails', "new-" + character.id, i + '.png?random=' + new Date().getTime()).replace(/\\/g, '/') + ')'
			else
				document.getElementById(i).style.backgroundImage = 'url(' + path.join(project.charactersPath, '..', 'thumbnails', "" + character.id, i + '.png?random=' + new Date().getTime()).replace(/\\/g, '/') + ')'
		} else document.getElementById(i).style.backgroundImage = ''
	}

	document.getElementById('char ' + i).className += " selected"
}

// Change which emote is highlighted in the UI
exports.setEmote = function(emote) {
	let selected = document.getElementsByClassName("emote selected")
	while (selected.length)
		selected[0].classList.remove("selected")

	document.getElementById(emote).className += " selected"
}

// Change whether the babble button is highlighted in the UI
exports.setBabble = function(babbling) {
	document.getElementById('babble').className = "babble" + (babbling ? " selected" : "")
}

// Update the hotbar button for a character
exports.updateCharacter = function(character, updateThumbnail) {
	let index = project.project.hotbar.indexOf(character.id)
	if (index > -1) {
		document.getElementById('char ' + index).getElementsByClassName('desc')[0].innerHTML = character.name
		if (updateThumbnail) {
			controller.updateCharacter(index, character)
			document.getElementById('char ' + index).style.backgroundImage = 'url(' + path.join(project.charactersPath, '..', 'thumbnails', 'new-' + character.id + '.png?random=' + new Date().getTime()).replace(/\\/g, '/') + ')'
		}
		if (('' + document.getElementById('char ' + index).className).indexOf('selected') > -1) {
			controller.setPuppetLocal(index)
			if (updateThumbnail) {
				let emotes = Object.keys(character.emotes)
				for (let i = 0; i < emotes.length; i++) {
					if (character.emotes[emotes[i]] && character.emotes[emotes[i]].enabled)
						document.getElementById(emotes[i]).style.backgroundImage = 'url(' + path.join(project.charactersPath, '..', 'thumbnails', 'new-' + character.id, i + '.png?random=' + new Date().getTime()).replace(/\\/g, '/') + ')'
				}
			}
		}
	}
	if (updateThumbnail) {
		let charPath
		if (fs.existsSync(path.join(project.charactersPath, '..', 'thumbnails', "new-" + character.id + '.png')))
			charPath = path.join(project.charactersPath, '..', 'thumbnails', 'new-' + character.id + '.png?random=' + new Date().getTime()).replace(/\\/g, '/')
		else charPath = path.join(project.charactersPath, '..', 'thumbnails', character.id + '.png?random=' + new Date().getTime()).replace(/\\/g, '/')
		
		let selector = document.getElementById('char selected')
		let i = selector.i
		if (selector && i == character.id)
			selector.style.backgroundImage = 'url(' + charPath + ')'
		
		selector = document.getElementById('char list').querySelector("[puppet='" + character.id + "']")
		if (selector)
			selector.style.backgroundImage = 'url(' + charPath + ')'
		else addCharSelector(character.id, i)
	}
}

// Remove a character from the hotbar
exports.deleteCharacter = function(index) {
	document.getElementById('char ' + index).getElementsByClassName('desc')[0].innerHTML = ''
	document.getElementById('char ' + index).style.backgroundImage = ''
}

// Pop the stage out
exports.openPopout = function() {
	document.getElementById('popout').innerHTML ='Pop In Stage'
	document.getElementById('screen').addEventListener('click', controller.togglePopout)
	document.getElementById('screen').className = 'container main button'
	document.getElementById('screen').innerHTML = '<div style="position: relative;top: 50%;transform: translateY(-50%);text-align:center;background-color:#242a33;">Click to Pop Stage Back In</div>'
}

// Reattach stage
exports.closePopout = function() {
	document.getElementById('popout').innerHTML = 'Pop Out Stage'
	document.getElementById('screen').removeEventListener('click', controller.togglePopout)
	document.getElementById('screen').className = 'container main'
	document.getElementById('screen').innerHTML = ''
}

exports.setView = function(newView) {
	if (view === 'stage')
		removeStageView()
	else if (view === 'editor')
		removeEditorView()
	settings.setView(newView)
	if (newView === 'stage')
		addStageView()
	else if (newView === 'editor')
		addEditorView()
	view = newView
	controller.resize()
}

exports.toggleModal = function(string) {
	if (modal.isOpen)
		modal.close()
	else
		modal.open(string)
}

function keyDown(e) {
	let key = e.keyCode ? e.keyCode : e.which

	if (e.target && (e.target.type === 'number' || e.target.type === 'text' || e.target.type === 'search' || e.target.type === 'select-one' || e.target.type === 'password'))
		return

	if (key == 32) {
		controller.startBabblingLocal()
		if (e.preventDefault) e.preventDefault()
	}
}

function keyUp(e) {
	let key = e.keyCode ? e.keyCode : e.which

	if (e.target && (e.target.type === 'number' || e.target.type === 'text' || e.target.type === 'search' || e.target.type === 'select-one' || e.target.type === 'password'))
		return

	if (editor.keyDown(e))
		return

	if (key > 48 && key < 58) {
		if (project.project.hotbar.length > key - 49) {
			controller.setPuppetLocal(key - 49, e.shiftKey, e.ctrlKey)
		}
	} else if (key == 85) controller.setEmoteLocal('0')
	else if (key == 73) controller.setEmoteLocal('1')
	else if (key == 79) controller.setEmoteLocal('2')
	else if (key == 80) controller.setEmoteLocal('3')
	else if (key == 74) controller.setEmoteLocal('4')
	else if (key == 75) controller.setEmoteLocal('5')
	else if (key == 76) controller.setEmoteLocal('6')
	else if (key == 186) controller.setEmoteLocal('7')
	else if (key == 77) controller.setEmoteLocal('8')
	else if (key == 188) controller.setEmoteLocal('9')
	else if (key == 190) controller.setEmoteLocal('10')
	else if (key == 191) controller.setEmoteLocal('11')
	else if (key == 37) controller.moveLeftLocal()
	else if (key == 38) controller.jiggleLocal()
	else if (key == 39) controller.moveRightLocal()
	else if (key == 32) controller.stopBabblingLocal()
	else if (key == 123) electron.remote.webContents.getFocusedWebContents().toggleDevTools()
}

function beforeUnload() {
	if (!project.checkChanges())
		return false
}

function charClick(e) {
	controller.setPuppetLocal(e.target.i, e.shiftKey, e.ctrlKey)
}

function charContextMenu(e) {
	let i = e.target.i
	document.getElementById('chars').style.display = 'none'
	document.getElementById('charselect').style.display = 'block'
	document.getElementById('char selected').i = project.project.hotbar[i]
	if (project.project.hotbar[i]) {
		if (fs.existsSync(path.join(project.charactersPath, '..', 'thumbnails', 'new-' + project.project.hotbar[i] + '.png')))
			document.getElementById('char selected').style.backgroundImage = 'url(' + path.join(project.charactersPath, '..', 'thumbnails', 'new-' + project.project.hotbar[i] + '.png?random=' + new Date().getTime()).replace(/\\/g, '/') + ')'
		else
			document.getElementById('char selected').style.backgroundImage = 'url(' + path.join(project.charactersPath, '..', 'thumbnails', project.project.hotbar[i] + '.png?random=' + new Date().getTime()).replace(/\\/g, '/') + ')'
	} else {
		document.getElementById('char selected').style.backgroundImage = ''
	}
	document.getElementById('char null').i = i
	let charList = document.getElementById('char list')
	charList.innerHTML = ''
	let characters = Object.keys(project.characters)
	for (let j = 0; j < characters.length; j++) {
		addCharSelector(characters[j], i)
	}
}

function addCharSelector(character, i) {
	let selector = document.createElement('div')
	selector.id = project.characters[character].name.toLowerCase()
	selector.className = "char"
	if (fs.existsSync(path.join(project.charactersPath, '..', 'thumbnails', 'new-' + character + '.png')))
		selector.style.backgroundImage = 'url(' + path.join(project.charactersPath, '..', 'thumbnails', 'new-' + character + '.png?random=' + new Date().getTime()).replace(/\\/g, '/') + ')'
	else
		selector.style.backgroundImage = 'url(' + path.join(project.charactersPath, '..', 'thumbnails', character + '.png?random=' + new Date().getTime()).replace(/\\/g, '/') + ')'
	document.getElementById('char list').appendChild(selector)
	selector.innerHTML = '<div class="desc">' + project.characters[character].name + '</div>'
	selector.i = i
	selector.puppet = character
	selector.setAttribute("puppet", parseInt(character))
	if (project.project.hotbar.indexOf(parseInt(character)) > -1) {
		selector.className += " disabled"
	} else {
		selector.addEventListener('click', updateHotbar)
	}
}

function updateHotbar(e) {
	let i = e.target.i
	let puppet = e.target.puppet
	document.getElementById('chars').style.display = 'block'
	document.getElementById('charselect').style.display = 'none'
	if (('' + document.getElementById('char ' + i).className).indexOf('selected') > -1 && puppet === '') {
		return
	}
	controller.updateHotbar(i, puppet)
	if (('' + document.getElementById('char ' + i).className).indexOf('selected') > -1) {
		controller.setPuppetLocal(i)
	}
	if (project.project.hotbar[i] && project.project.hotbar[i] !== 0) {
		document.getElementById('char ' + i).getElementsByClassName('desc')[0].innerHTML = project.characters[puppet].name
		if (fs.existsSync(path.join(project.charactersPath, '..', 'thumbnails', puppet + '.png')))
			document.getElementById('char ' + i).style.backgroundImage = 'url(' + path.join(project.charactersPath, '..', 'thumbnails', puppet + '.png?random=' + new Date().getTime()).replace(/\\/g, '/') + ')'
		else
			document.getElementById('char ' + i).style.backgroundImage = 'url(' + path.join(project.charactersPath, '..', 'thumbnails', 'new-' + puppet + '.png?random=' + new Date().getTime()).replace(/\\/g, '/') + ')'
	} else {
		document.getElementById('char ' + i).getElementsByClassName('desc')[0].innerHTML = ''
		document.getElementById('char ' + i).style.backgroundImage = ''
	}
}

function updateCharSearch(e) {
	let list = document.getElementById('char list')
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

function charSelectedClick() {
	document.getElementById('chars').style.display = 'block'
	document.getElementById('charselect').style.display = 'none'
}

function toggleGreenScreen() {
	let style = document.getElementById('screen').style
	if (style.backgroundColor === '')
		style.backgroundColor = project.project.greenScreen
	else 
		style.backgroundColor = ''
}

function emoteClick(e) {
	controller.setEmoteLocal(e.target.emote)
}

function toggleSettings() {
	if (document.getElementById('settings-panel').style.display == 'none') {
		document.getElementById('settings-panel').style.display = 'block'
		document.getElementById('character-panel').style.display = 'none'
		document.getElementById('multiplayer-panel').style.display = 'none'
		
		document.getElementById('settings').classList.add('open-tab')
		document.getElementById('multiplayer').classList.remove('open-tab')
	} else {
		document.getElementById('settings-panel').style.display = 'none'
		document.getElementById('character-panel').style.display = 'block'

		document.getElementById('settings').classList.remove('open-tab')
	}
}

function toggleMultiplayer() {
	if (document.getElementById('multiplayer-panel').style.display == 'none') {
		document.getElementById('settings-panel').style.display = 'none'
		document.getElementById('character-panel').style.display = 'none'
		document.getElementById('multiplayer-panel').style.display = 'block'
		
		document.getElementById('settings').classList.remove('open-tab')
		document.getElementById('multiplayer').classList.add('open-tab')

		document.getElementById('roomPassword').type = 'password'
	} else {
		document.getElementById('multiplayer-panel').style.display = 'none'
		document.getElementById('character-panel').style.display = 'block'

		document.getElementById('multiplayer').classList.remove('open-tab')
	}
}

function roomPasswordChange(e) {
	project.project.roomPassword = e.target.value
	network.emit('change password', e.target.value)
}

function togglePasswordVisibility() {
	let password = document.getElementById('roomPassword')
	if (password.type === 'password')
		password.type = 'text'
	else
		password.type = 'password'
}

function colorpickerChange(e) {
	project.project.greenScreen = e.target.value
	if (document.getElementById('screen').style.backgroundColor !== '')
		document.getElementById('screen').style.backgroundColor = project.project.greenScreen
}

function toggleAlwaysOnTop(e) {
	project.project.alwaysOnTop = e.target.checked
}

function puppetscaleChange(e) {
	project.project.puppetScale = parseFloat(e.target.value)
	controller.resize()
}

function numslotsChange(e) {
	project.project.numCharacters = parseInt(e.target.value)
	controller.resize()
}

function nicknameChange(e) {
	project.project.nickname = e.target.value
	network.changeNickname()
}

function randomNickname() {
	project.randomNickname()
	document.getElementById('nickname').value = project.project.nickname
	network.changeNickname()
}

function roomPuppetscaleChange(e) {
	project.project.roomPuppetScale = project.network.puppetScale = parseFloat(e.target.value)
	controller.resize()
	network.emit('set scale', project.network.puppetScale)
}

function roomNumslotsChange(e) {
	project.project.roomNumCharacters = project.network.numCharacters = parseInt(e.target.value)
	controller.resize()
	network.emit('set slots', project.network.numCharacters)
}

function removeStageView() {
	document.getElementById('screen').style.width = ''
	document.getElementById('status').style.width = ''
	document.getElementById('bottom').style.width = ''
	document.getElementById('side').style.display = ''
}

function removeEditorView() {
	document.getElementById('screen').style.display = ''
	document.getElementById('editor').insertBefore(document.getElementById('editor-screen'), document.getElementById('puppet-panels'))
	document.getElementById('editor').insertBefore(document.getElementById('editor-layers'), document.getElementById('puppet-panels'))
	document.getElementById('editor-screen').className = 'editormain'
	document.getElementById('editor-layers').className = 'small'
	document.getElementById('editor-open-panel').style.display = 'none'
	document.getElementById('editor-emotes-panel').style.display = 'none'
	document.getElementById('editor-settings-panel').style.display = 'none'
	document.getElementById('editor-open').classList.remove('open-tab')
	document.getElementById('editor-emotes').classList.remove('open-tab')
	document.getElementById('editor-settings').classList.remove('open-tab')
	document.getElementById('bottom').style.display = ''
}

function addStageView() {
	document.getElementById('screen').style.width = 'unset'
	document.getElementById('status').style.width = 'unset'
	document.getElementById('bottom').style.width = 'unset'
	document.getElementById('side').style.display = 'none'
}

function addEditorView() {
	document.getElementById('screen').style.display = 'none'
	document.getElementById('editor-screen').style.display = ''
	document.getElementById('editor-layers').style.display = ''
	document.getElementById('editor-screen').className = 'editormain container main'
	document.getElementById('editor-layers').className = 'container small status'
	document.body.append(document.getElementById('editor-screen'))
	document.body.append(document.getElementById('editor-layers'))
	document.getElementById('editor-open').click()
	document.getElementById('bottom').style.display = 'none'
}

function openAutocrop() {
	exports.toggleModal("#autocrop")
	document.getElementById('autocrop-desc').style.display = 'block'
	document.getElementById('autocrop-btn').style.display = 'block'
	document.getElementById('autocrop-assets').innerHTML = ''
	document.getElementById('autocrop-progress').innerHTML = ''
}

function startAutocrop() {
	// Remove the description and set up progress display
	document.getElementById('autocrop-desc').style.display = 'none'
	document.getElementById('autocrop-btn').style.display = 'none'
	let assetsList = document.getElementById('autocrop-assets')
	let assets = []
	let keys = Object.keys(project.assets)
	for (let i = 0; i < keys.length; i++) {
		if (project.assets[keys[i]].type === "animated") continue
		assets.push({
			name: project.assets[keys[i]].name,
			location: project.assets[keys[i]].location,
			id: keys[i]
		})
		let asset = document.createElement('div')
		asset.id = 'autocrop-' + keys[i]
		asset.className = "asset"
		asset.style.backgroundImage = 'url(' + path.join(project.assetsPath, project.assets[keys[i]].location + '?random=' + new Date().getTime()).replace(/\\/g, '/') + ')'
		asset.innerHTML = '<div class="desc">' + project.assets[keys[i]].name + '</div>'
		assetsList.appendChild(asset)
	}
	document.getElementById('autocrop-progress').innerHTML = 'Autocropping asset 0 of ' + assets.length

	// I tried to do this with web workers but since they can't use the DOM it didn't work (needed for using canvases)
	document.body.style.pointerEvents = 'none'
	let object = {
		trimmer: require('./../lib/trim_canvas'),
		errors: 0,
		assets: assets,
		i: 0
	}
	if (assets.length > 0)
		requestAnimationFrame(autocrop.bind(object))
	else {
		document.body.style.pointerEvents = 'none'
		document.getElementById('autocrop-progress').innerHTML = 'No assets to crop'    
	}
}

function openPrune() {
	exports.toggleModal("#prune")
	document.getElementById('prune-btn').disabled = network.isNetworking()
}

function pruneAssets() {
	exports.toggleModal()
	controller.pruneAssets()
}

function autocrop() {
	let trimmer = this.trimmer
	let errors = this.errors
	let assets = this.assets
	let i = this.i
	document.getElementById('autocrop-' + assets[i].id).className = "asset available selected"
	document.getElementById('autocrop-progress').innerHTML = 'Autocropping asset ' + (i + 1) + ' of ' + assets.length
	let canvas = document.createElement('canvas')
	let ctx = canvas.getContext("2d")
	let image = document.createElement('img')
	image.onload = () => {
		canvas.width = image.width
		canvas.height = image.height
		ctx.drawImage(image, 0, 0)
		canvas.style.display = 'none'
		document.body.appendChild(canvas)
		try {
			let data = trimmer.trimCanvas(canvas)
			let newAsset = data.canvas.toDataURL().replace(/^data:image\/\w+;base64,/, "")
			document.getElementById('autocrop-' + assets[i].id).className = "asset available"
			fs.writeFileSync(path.join(project.assetsPath, assets[i].location), new Buffer(newAsset, 'base64'))
			document.getElementById('autocrop-' + assets[i].id).style.backgroundImage = 'url(' + path.join(project.assetsPath, assets[i].location + '?random=' + new Date().getTime()).replace(/\\/g, '/') + ')'
			// Move assets to compensate for cropping
			controller.updateAsset(assets[i].id, data.x, data.y)
		} catch (e) {
			// Failed to crop asset, probably because the image has no non-transparent pixels
			console.error(e)
			document.getElementById('autocrop-' + assets[i].id).className = "asset"
			errors++
		}
		canvas.remove()
		if (i + 1 === assets.length) {
			document.body.style.pointerEvents = ''
			document.getElementById('autocrop-progress').innerHTML = (errors === 0 ? 'Finished autocropping' : 'Finished with ' + errors + ' failed assets')
			project.saveProject()
		} else {
			requestAnimationFrame(autocrop.bind({
				trimmer, errors, assets, i: i+1
			}))
		}
	}
	image.src = path.join(project.assetsPath, assets[i].location)
}
