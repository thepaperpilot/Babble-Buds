// This file is required by the application.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

// Imports
const electron = require('electron')
const controller = require('./controller.js')
const network = require('./network.js')
const path = require('path')
const fs = require('fs-extra')

var project

// Constants
var emotes = ['default', 'happy', 'wink', 'kiss', 'angry', 'sad', 'ponder', 'gasp', 'veryangry', 'verysad', 'confused', 'ooo']

exports.init = function() {
	project = electron.remote.getGlobal('project').project

	// Window input events
	window.onkeydown = keyDown
	window.onkeyup = keyUp
	window.onbeforeunload = beforeUnload

	// DOM listeners
	for (var i = 0; i < 9; i++) {
		var element = document.getElementById('char ' + i)
		element.i = i
		element.addEventListener('click', charClick)
		element.addEventListener('contextmenu', charContextMenu)
		if (project.project.hotbar[i]) {
			element.getElementsByClassName('desc')[0].innerHTML = project.characters[project.project.hotbar[i]].name
			element.style.backgroundImage = 'url(' + path.join(project.assetsPath, '..', 'thumbnails', project.project.hotbar[i] + '.png?random=' + new Date().getTime()) + ')'
		}
	}
	document.getElementById('char null').addEventListener('click', updateHotbar)
	document.getElementById('char null').puppet = ''
	document.getElementById('char search').addEventListener('keyup', updateCharSearch)
	document.getElementById('char search').addEventListener('search', updateCharSearch)
	document.getElementById('char selected').addEventListener('click', charSelectedClick)
	document.getElementById('greenscreen').addEventListener('click', toggleGreenScreen)
	for (var i = 0; i < emotes.length; i++) {
		var element = document.getElementById(emotes[i])
		element.emote = emotes[i]
		element.addEventListener('click', emoteClick)
	}
	document.getElementById('popout').addEventListener('click', controller.popOut)
	document.getElementById('settings').addEventListener('click', toggleSettings)
	document.getElementById('colorpicker').addEventListener('change', colorpickerChange)
	document.getElementById('transparent').addEventListener('click', toggleTransparent)
	document.getElementById('minslotwidth').addEventListener('change', minslotwidthChange)
	document.getElementById('numslots').addEventListener('change', numslotsChange)
	document.getElementById('ip').addEventListener('change', ipChange)
	document.getElementById('port').addEventListener('change', portChange)
	document.getElementById('host').addEventListener('click', network.host)
	document.getElementById('connect').addEventListener('click', network.connect)

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
	electron.ipcRenderer.on('loaded', () => {
		controller.emitPopout('setup', project, project.getPuppet())
	})

	// Load settings values
	document.getElementById('colorpicker').value = project.project.greenScreen
	document.getElementById('transparent').checked = project.project.transparent
	document.getElementById('minslotwidth').value = project.project.minSlotWidth
	document.getElementById('numslots').value = project.project.numCharacters
	document.getElementById('ip').value = project.project.ip
	document.getElementById('port').value = project.project.port
}

// Update UI when user selects a new puppet
// Specifically, tint the character in the hotbar,
//  and tint available emotes for this puppet
exports.setPuppet = function(i, emotes) {
	var available = document.getElementById('emotes').getElementsByClassName("available")
	while (available.length)
		available[0].classList.remove("available")

	var selected = document.getElementsByClassName("char selected")
	while (selected.length)
		selected[0].classList.remove("selected")

	var emoteKeys = Object.keys(emotes)
	for (var j = 0; j < emoteKeys.length; j++)
		document.getElementById(emoteKeys[j]).className += " available"

	document.getElementById('char ' + i).className += " selected"
}

// Change which emote is highlighted in the UI
exports.setEmote = function(emote) {
	var selected = document.getElementsByClassName("emote selected")
	while (selected.length)
		selected[0].classList.remove("selected")

	document.getElementById(emote).className += " selected"
}

// Change whether the babble button is highlighted in the UI
exports.setBabble = function(babbling) {
	document.getElementById('babble').className = "babble" + (babbling ? " selected" : "")
}

// Update the hotbar button for a character
exports.updateCharacter = function(character, thumbnail) {
	var index = project.project.hotbar.indexOf(character.id)
	if (index > -1) {
		controller.updateCharacter(index, character)
		if (('' + document.getElementById('char ' + index).className).indexOf('selected') > -1) {
			controller.setPuppetLocal(index)
		}
		document.getElementById('char ' + index).getElementsByClassName('desc')[0].innerHTML = character.name
	}
	if (thumbnail) {
		fs.ensureDirSync(path.join(project.assetsPath, '..', 'thumbnails'))
		fs.writeFile(path.join(project.assetsPath, '..', 'thumbnails', character.id + '.png'), new Buffer(thumbnail, 'base64'), (err) => {
	        if (err) console.log(err)
	        if (index > -1) {
	        	document.getElementById('char ' + index).style.backgroundImage = 'url(' + path.join(project.assetsPath, '..', 'thumbnails', character.id + '.png?random=' + new Date().getTime()) + ')'
	        }
	    })
	}
}

// Remove a character from the hotbar
exports.deleteCharacter = function(index) {
	document.getElementById('char ' + index).getElementsByClassName('desc')[0].innerHTML = ''
	document.getElementById('char ' + index).style.backgroundImage = ''
}

// Pop the stage out
exports.openPopout = function() {
	document.getElementById('popout').innerHTML ='Close Pop Out'
	document.getElementById('popout').removeEventListener('click', controller.popOut)
	document.getElementById('popout').addEventListener('click', controller.popIn)
	document.getElementById('screen').addEventListener('click', controller.popIn)
	document.getElementById('screen').className = 'container main button'
	document.getElementById('screen').innerHTML = '<div style="position: relative;top: 50%;transform: translateY(-50%);text-align:center;background-color:#242a33;">Click to Pop In Show Panel</div>'
}

// Reattach stage
exports.closePopout = function() {
	document.getElementById('popout').innerHTML = 'Pop Out Show Panel'
	document.getElementById('popout').addEventListener('click', controller.popOut)
	document.getElementById('popout').removeEventListener('click', controller.popIn)
	document.getElementById('screen').removeEventListener('click', controller.popIn)
	document.getElementById('screen').className = 'container main'
	document.getElementById('screen').innerHTML = ''
}

function keyDown(e) {
	var key = e.keyCode ? e.keyCode : e.which

	if (e.target && (e.target.type === 'number' || e.target.type === 'text' || e.target.type === 'search'))
		return

	if (key == 32) {
		controller.startBabblingLocal()
		if (e.preventDefault) e.preventDefault()
	}
}

function keyUp(e) {
	var key = e.keyCode ? e.keyCode : e.which

	if (e.target && (e.target.type === 'number' || e.target.type === 'text' || e.target.type === 'search'))
		return

	if (key > 48 && key < 58) {
		if (project.project.hotbar.length > key - 49) {
			controller.setPuppetLocal(key - 49)
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
	else if (key == 39) controller.moveRightLocal()
	else if (key == 32) controller.stopBabblingLocal()
}

function beforeUnload() {
	if (!project.checkChanges())
		return false
}

function charClick(e) {
	controller.setPuppetLocal(e.target.i)
}

function charContextMenu(e) {
	var i = e.target.i
	document.getElementById('chars').style.display = 'none'
	document.getElementById('charselect').style.display = 'block'
	if (project.project.hotbar[i]) {
		document.getElementById('char selected').getElementsByClassName('desc')[0].innerHTML = project.characters[project.project.hotbar[i]].name
		document.getElementById('char selected').style.backgroundImage = 'url(' + path.join(project.assetsPath, '..', 'thumbnails', project.project.hotbar[i] + '.png?random=' + new Date().getTime()) + ')'
	} else {
		document.getElementById('char selected').getElementsByClassName('desc')[0].innerHTML = ''
		document.getElementById('char selected').style.backgroundImage = ''
	}
	document.getElementById('char null').i = i
	var charList = document.getElementById('char list')
	charList.innerHTML = ''
	var characters = Object.keys(project.characters)
	for (var j = 0; j < characters.length; j++) {
		var selector = document.createElement('div')
		selector.id = project.characters[characters[j]].name.toLowerCase()
		selector.className = "char"
		selector.style.backgroundImage = 'url(' + path.join(project.assetsPath, '..', 'thumbnails', characters[j] + '.png?random=' + new Date().getTime()) + ')'
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
	var i = e.target.i
	var puppet = e.target.puppet
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
		document.getElementById('char ' + i).style.backgroundImage = 'url(' + path.join(project.assetsPath, '..', 'thumbnails', puppet + '.png?random=' + new Date().getTime()) + ')'
	} else {
		document.getElementById('char ' + i).getElementsByClassName('desc')[0].innerHTML = ''
		document.getElementById('char ' + i).style.backgroundImage = ''
	}
}

function updateCharSearch(e) {
	var list = document.getElementById('char list')
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

function charSelectedClick() {
	document.getElementById('chars').style.display = 'block'
	document.getElementById('charselect').style.display = 'none'
}

function toggleGreenScreen() {
	var style = document.getElementById('screen').style
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

function toggleTransparent(e) {
	project.project.transparent = e.target.checked
}

function minslotwidthChange(e) {
	project.project.minSlotwidth = parseInt(e.target.value)
	controller.resize()
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
