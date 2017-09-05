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

// Constants
let emotes = ['default', 'happy', 'wink', 'kiss', 'angry', 'sad', 'ponder', 'gasp', 'veryangry', 'verysad', 'confused', 'ooo']

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
			element.style.backgroundImage = 'url(' + path.join(project.assetsPath, '..', 'thumbnails', project.project.hotbar[i] + '.png?random=' + new Date().getTime()).replace(/\\/g, '/') + ')'
		}
	}
	document.getElementById('char null').addEventListener('click', updateHotbar)
	document.getElementById('char null').puppet = ''
	document.getElementById('char search').addEventListener('keyup', updateCharSearch)
	document.getElementById('char search').addEventListener('search', updateCharSearch)
	document.getElementById('char selected').addEventListener('click', charSelectedClick)
	document.getElementById('greenscreen').addEventListener('click', toggleGreenScreen)
	for (let i = 0; i < emotes.length; i++) {
		let element = document.getElementById(emotes[i])
		element.emote = emotes[i]
		element.addEventListener('click', emoteClick)
	}
	document.getElementById('babble').addEventListener('mousedown', controller.startBabblingLocal)
	document.getElementById('babble').addEventListener('mouseup', controller.stopBabblingLocal)
	document.getElementById('popout').addEventListener('click', controller.togglePopout)
	document.getElementById('settings').addEventListener('click', toggleSettings)
	document.getElementById('colorpicker').addEventListener('change', colorpickerChange)
	document.getElementById('alwaysontop').addEventListener('click', toggleAlwaysOnTop)
	document.getElementById('puppetscale').addEventListener('change', puppetscaleChange)
	document.getElementById('numslots').addEventListener('change', numslotsChange)
	document.getElementById('ip').addEventListener('change', ipChange)
	document.getElementById('port').addEventListener('change', portChange)
	document.getElementById('host').addEventListener('click', network.host)
	document.getElementById('connect').addEventListener('click', network.connect)
	document.getElementById('autocrop-btn').addEventListener('click', startAutocrop)

	// Handle input events from popout
	electron.ipcRenderer.on('keyDown', (event, key) => {
		window.onkeydown({"keyCode": key})
	})
	electron.ipcRenderer.on('keyUp', (event, key) => {
		window.onkeyup({"keyCode": key})
	})
	electron.ipcRenderer.on('init', () => {
		controller.emitPopout('init', network.getPuppets())
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
	electron.ipcRenderer.on('loaded', controller.setupPopout)

	// Load settings values
	document.getElementById('colorpicker').value = project.project.greenScreen
	document.getElementById('alwaysontop').checked = project.project.alwaysOnTop
	document.getElementById('puppetscale').value = project.project.puppetScale
	document.getElementById('numslots').value = project.project.numCharacters
	document.getElementById('ip').value = project.project.ip
	document.getElementById('port').value = project.project.port
}

// Update UI when user selects a new puppet
// Specifically, tint the character in the hotbar,
//  and tint available emotes for this puppet
exports.setPuppet = function(i, enabledEmotes) {
	let available = document.getElementById('emotes').getElementsByClassName("available")
	while (available.length)
		available[0].classList.remove("available")

	let selected = document.getElementsByClassName("char selected")
	while (selected.length)
		selected[0].classList.remove("selected")

	let emoteKeys = Object.keys(enabledEmotes)
	for (let j = 0; j < emoteKeys.length; j++)
		document.getElementById(emoteKeys[j]).className += " available"

	let character = JSON.parse(JSON.stringify(project.characters[project.project.hotbar[i]]))
	for (let i = 0; i < emotes.length; i++) {
		if (character.emotes[emotes[i]] && character.emotes[emotes[i]].enabled) {
			if (fs.existsSync(path.join(project.assetsPath, '..', 'thumbnails', "new-" + character.id, emotes[i] + '.png')))
				document.getElementById(emotes[i]).style.backgroundImage = 'url(' + path.join(project.assetsPath, '..', 'thumbnails', "new-" + character.id, emotes[i] + '.png?random=' + new Date().getTime()).replace(/\\/g, '/') + ')'
			else
				document.getElementById(emotes[i]).style.backgroundImage = 'url(' + path.join(project.assetsPath, '..', 'thumbnails', "" + character.id, emotes[i] + '.png?random=' + new Date().getTime()).replace(/\\/g, '/') + ')'
		} else document.getElementById(emotes[i]).style.backgroundImage = ''
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
		controller.updateCharacter(index, character)
		if (('' + document.getElementById('char ' + index).className).indexOf('selected') > -1) {
			controller.setPuppetLocal(index)
			if (updateThumbnail)
				for (let i = 0; i < emotes.length; i++) {
					if (character.emotes[emotes[i]] && character.emotes[emotes[i]].enabled)
						document.getElementById(emotes[i]).style.backgroundImage = 'url(' + path.join(project.assetsPath, '..', 'thumbnails', 'new-' + character.id, emotes[i] + '.png?random=' + new Date().getTime()).replace(/\\/g, '/') + ')'
				}
		}
		document.getElementById('char ' + index).getElementsByClassName('desc')[0].innerHTML = character.name
		if (updateThumbnail) {
			document.getElementById('char ' + index).style.backgroundImage = 'url(' + path.join(project.assetsPath, '..', 'thumbnails', 'new-' + character.id + '.png?random=' + new Date().getTime()).replace(/\\/g, '/') + ')'
		}
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
	if (newView === 'stage')
		addStageView()
	else if (newView === 'editor')
		addEditorView()
	view = newView
	settings.setView(view)
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

	if (e.target && (e.target.type === 'number' || e.target.type === 'text' || e.target.type === 'search'))
		return

	if (key == 32) {
		controller.startBabblingLocal()
		if (e.preventDefault) e.preventDefault()
	}
}

function keyUp(e) {
	let key = e.keyCode ? e.keyCode : e.which

	if (e.target && (e.target.type === 'number' || e.target.type === 'text' || e.target.type === 'search'))
		return

	if (editor.keyDown(e))
		return

	if (key > 48 && key < 58) {
		if (project.project.hotbar.length > key - 49) {
			controller.setPuppetLocal(key - 49, e.shiftKey, e.ctrlKey)
		}
	} else if (key == 85) controller.setEmoteLocal('default')
	else if (key == 73) controller.setEmoteLocal('happy')
	else if (key == 79) controller.setEmoteLocal('wink')
	else if (key == 80) controller.setEmoteLocal('kiss')
	else if (key == 74) controller.setEmoteLocal('angry')
	else if (key == 75) controller.setEmoteLocal('sad')
	else if (key == 76) controller.setEmoteLocal('ponder')
	else if (key == 186) controller.setEmoteLocal('gasp')
	else if (key == 77) controller.setEmoteLocal('veryangry')
	else if (key == 188) controller.setEmoteLocal('verysad')
	else if (key == 190) controller.setEmoteLocal('confused')
	else if (key == 191) controller.setEmoteLocal('ooo')
	else if (key == 37) controller.moveLeftLocal()
	else if (key == 38) controller.jiggleLocal()
	else if (key == 39) controller.moveRightLocal()
	else if (key == 32) controller.stopBabblingLocal()
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
	if (project.project.hotbar[i]) {
		if (fs.existsSync(path.join(project.assetsPath, '..', 'thumbnails', project.project.hotbar[i] + '.png')))
			document.getElementById('char selected').style.backgroundImage = 'url(' + path.join(project.assetsPath, '..', 'thumbnails', project.project.hotbar[i] + '.png?random=' + new Date().getTime()).replace(/\\/g, '/') + ')'
		else
			document.getElementById('char selected').style.backgroundImage = 'url(' + path.join(project.assetsPath, '..', 'thumbnails', 'new-' + project.project.hotbar[i] + '.png?random=' + new Date().getTime()).replace(/\\/g, '/') + ')'
	} else {
		document.getElementById('char selected').style.backgroundImage = ''
	}
	document.getElementById('char null').i = i
	let charList = document.getElementById('char list')
	charList.innerHTML = ''
	let characters = Object.keys(project.characters)
	for (let j = 0; j < characters.length; j++) {
		let selector = document.createElement('div')
		selector.id = project.characters[characters[j]].name.toLowerCase()
		selector.className = "char"
		if (fs.existsSync(path.join(project.assetsPath, '..', 'thumbnails', characters[j] + '.png')))
			selector.style.backgroundImage = 'url(' + path.join(project.assetsPath, '..', 'thumbnails', characters[j] + '.png?random=' + new Date().getTime()).replace(/\\/g, '/') + ')'
		else
			selector.style.backgroundImage = 'url(' + path.join(project.assetsPath, '..', 'thumbnails', 'new-' + characters[j] + '.png?random=' + new Date().getTime()).replace(/\\/g, '/') + ')'
		charList.appendChild(selector)
		selector.innerHTML = '<div class="desc">' + project.characters[characters[j]].name + '</div>'
		selector.i = i
		selector.puppet = characters[j]
		if (project.project.hotbar.indexOf(parseInt(characters[j])) > -1) {
			selector.className += " disabled"
		} else {
			selector.addEventListener('click', updateHotbar)
		}
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
		controller.setPuppet(i)
	}
	if (project.project.hotbar[i] && project.project.hotbar[i] !== 0) {
		document.getElementById('char ' + i).getElementsByClassName('desc')[0].innerHTML = project.characters[puppet].name
		if (fs.existsSync(path.join(project.assetsPath, '..', 'thumbnails', puppet + '.png')))
			document.getElementById('char ' + i).style.backgroundImage = 'url(' + path.join(project.assetsPath, '..', 'thumbnails', puppet + '.png?random=' + new Date().getTime()).replace(/\\/g, '/') + ')'
		else
			document.getElementById('char ' + i).style.backgroundImage = 'url(' + path.join(project.assetsPath, '..', 'thumbnails', 'new-' + puppet + '.png?random=' + new Date().getTime()).replace(/\\/g, '/') + ')'
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
		document.getElementById('chars').style.display = 'none'
		document.getElementById('charselect').style.display = 'none'
		document.getElementById('emotes').style.display = 'none'
	} else {
		document.getElementById('settings-panel').style.display = 'none'
		document.getElementById('chars').style.display = 'block'
		document.getElementById('emotes').style.display = 'block'
	}
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
	network.emit('set scale', project.project.puppetScale)
}

function numslotsChange(e) {
	project.project.numCharacters = parseInt(e.target.value)
	controller.resize()
	network.emit('set slots', project.project.numCharacters)
}

function ipChange(e) {
	project.project.ip = e.target.value
}

function portChange(e) {
	project.project.port = parseInt(e.target.value)
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
	document.getElementById('editor-screen').className = 'editormain'
    document.getElementById('editor-open-panel').style.display = 'none'
    document.getElementById('editor-settings-panel').style.display = 'none'
    document.getElementById('editor-layers-panel').style.display = 'none'
    document.getElementById('editor-babble-panel').style.display = 'none'
	document.getElementById('editor').style.display = ''
	document.getElementById('bottom').style.display = ''
	document.getElementById('editor-bottom').style.display = 'none'
	document.getElementById('assets').style.height = ''

	// Bottom Panel Stuff
	document.getElementById('editor-open-panel').className = 'charselector editorpanel'
	document.getElementById('editor-open-panel').style.height = ''
	document.getElementById('editor-layers-panel').className = 'scroll editorpanel'
	document.getElementById('editor-layers-panel').style.height = ''
	document.getElementById('editor-babble-panel').className = 'scroll editorpanel'
	document.getElementById('editor-babble-panel').style.height = ''
	document.getElementById('editor-settings-panel').className = 'scroll editorpanel'
	document.getElementById('editor-settings-panel').style.height = ''
	document.getElementById('babble-emotes').style.margin = ''
	document.getElementById('babble-mouths').style.margin = ''
	document.getElementById('babble-eyes').style.margin = ''
	document.getElementById('editor').insertBefore(document.getElementById('editor-open-panel'), document.getElementById('puppet-panels'))
	document.getElementById('editor').insertBefore(document.getElementById('editor-layers-panel'), document.getElementById('puppet-panels'))
	document.getElementById('editor').insertBefore(document.getElementById('editor-babble-panel'), document.getElementById('puppet-panels'))
	document.getElementById('editor').insertBefore(document.getElementById('editor-settings-panel'), document.getElementById('puppet-panels'))
}

function addStageView() {
	document.getElementById('screen').style.width = 'unset'
	document.getElementById('status').style.width = 'unset'
	document.getElementById('bottom').style.width = 'unset'
	document.getElementById('side').style.display = 'none'
}

function addEditorView() {
	document.getElementById('screen').style.display = 'none'
	document.body.prepend(document.getElementById('editor-screen'))
	document.getElementById('editor-screen').className = 'editormain container main'
    document.getElementById('editor-open-panel').style.display = 'none'
    document.getElementById('editor-settings-panel').style.display = 'none'
    document.getElementById('editor-layers-panel').style.display = ''
    document.getElementById('editor-babble-panel').style.display = ''
	document.getElementById('editor').style.display = 'none'
	document.getElementById('bottom').style.display = 'none'
	document.getElementById('editor-bottom').style.display = ''
	document.getElementById('assets').style.height = '100%'

	// Bottom Panel Stuff
	document.getElementById('editor-open-panel').className = 'charselector s4 editorpanel'
	document.getElementById('editor-open-panel').style.height = 'calc(100% - 10px )'
	document.getElementById('editor-layers-panel').className = 'scroll s4 editorpanel'
	document.getElementById('editor-layers-panel').style.height = 'calc(100% - 10px )'
	document.getElementById('editor-babble-panel').className = 'scroll s4 editorpanel'
	document.getElementById('editor-babble-panel').style.height = 'calc(100% - 10px )'
	document.getElementById('editor-settings-panel').className = 'scroll s4 editorpanel'
	document.getElementById('editor-settings-panel').style.height = 'calc(100% - 10px )'
	document.getElementById('babble-emotes').style.margin = '4px auto'
	document.getElementById('babble-mouths').style.margin = 'auto'
	document.getElementById('babble-eyes').style.margin = 'auto'
	document.getElementById('editor-bottom').append(document.getElementById('editor-open-panel'))
	document.getElementById('editor-bottom').append(document.getElementById('editor-layers-panel'))
	document.getElementById('editor-bottom').append(document.getElementById('editor-babble-panel'))
	document.getElementById('editor-bottom').append(document.getElementById('editor-settings-panel'))
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
	let tabs = Object.keys(project.assets)
	for (let i = 0; i < tabs.length; i++) {
		let hashes = Object.keys(project.assets[tabs[i]])
		for (let j = 0; j < hashes.length; j++) {
			assets.push({
				name: project.assets[tabs[i]][hashes[j]].name,
				location: project.assets[tabs[i]][hashes[j]].location,
				tab: tabs[i],
				hash: hashes[j]
			})
			let asset = document.createElement('div')
			asset.id = 'autocrop-' + tabs[i] + '-' + hashes[j]
			asset.className = "asset"
			asset.style.backgroundImage = 'url(' + path.join(project.assetsPath, project.assets[tabs[i]][hashes[j]].location + '?random=' + new Date().getTime()).replace(/\\/g, '/') + ')'
			asset.innerHTML = '<div class="desc">' + project.assets[tabs[i]][hashes[j]].name + '</div>'
			assetsList.appendChild(asset)
		}
	}
	document.getElementById('autocrop-progress').innerHTML = 'Autocropping asset 0 of ' + assets.length


	// I tried to do this with web workers but since they can't use the DOM it didn't work (needed for using canvases)
	let trimmer = require('./../lib/trim_canvas')
	let errors = 0
	for (let i = 0; i < assets.length; i++) {
		document.getElementById('autocrop-' + assets[i].tab + '-' + assets[i].hash).className = "asset available selected"
		document.getElementById('autocrop-progress').innerHTML = 'Autocropping asset ' + (i + 1) + ' of ' + assets.length
	    let canvas = document.createElement('canvas')
	    let ctx = canvas.getContext("2d")
	    let image = document.createElement('img')
	    image.src = path.join(project.assetsPath, assets[i].location)
	    canvas.width = image.width
	    canvas.height = image.height
		ctx.drawImage(image, 0, 0)
	    canvas.style.display = 'none'
	    document.body.appendChild(canvas)
		try {
			let data = trimmer.trimCanvas(canvas)
			let newAsset = data.canvas.toDataURL().replace(/^data:image\/\w+;base64,/, "")
			document.getElementById('autocrop-' + assets[i].tab + '-' + assets[i].hash).className = "asset available"
			fs.writeFileSync(path.join(project.assetsPath, assets[i].location), new Buffer(newAsset, 'base64'))
			document.getElementById('autocrop-' + assets[i].tab + '-' + assets[i].hash).style.backgroundImage = 'url(' + path.join(project.assetsPath, assets[i].location + '?random=' + new Date().getTime()).replace(/\\/g, '/') + ')'
			// Move assets to compensate for cropping
			controller.updateAsset(assets[i].tab, assets[i].hash, data.x, data.y)
		} catch (e) {
			// Failed to crop asset, probably because the image has no non-transparent pixels
			console.error(e)
			document.getElementById('autocrop-' + assets[i].tab + '-' + assets[i].hash).className = "asset"
			errors++
		}
		canvas.remove()
	}
	document.getElementById('autocrop-progress').innerHTML = (errors === 0 ? 'Finished autocropping' : 'Finished with ' + errors + ' failed assets')
	// Reload everything
	controller.reloadAssets()
}
