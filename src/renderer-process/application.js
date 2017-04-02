// This file is required by the application.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const electron = require('electron')
const remote = electron.remote
const BrowserWindow = remote.BrowserWindow
const babble = require('./babble.js')
const project = remote.require('./main-process/project')
const path = require('path')
const url = require('url')
const http = require('http')
const ss = require('socket.io-stream')
const fs = require('fs-extra')

var emotes = ['default', 'happy', 'wink', 'kiss', 'angry', 'sad', 'ponder', 'gasp', 'veryangry', 'verysad', 'confused', 'ooo']
var hotbar = []
var puppet
var popout
var server
var puppets = []
var numPuppets = 1

babble.init('screen', project.project, project.assets, project.assetsPath, loadPuppets)

function loadPuppets() {
	// Add Puppet
	puppet = babble.addPuppet(createPuppet(project.puppet), 1)

	// Create Hotbar Puppets
	for (var i = 0; i < project.project.hotbar.length; i++) {
		if (project.project.hotbar[i] !== '')
			hotbar[i] = babble.createPuppet(project.characters[project.project.hotbar[i]])
	}

	// Update Editor
	var available = document.getElementsByClassName("available")
	while (available.length)
		available[0].classList.remove("available")

	var selected = document.getElementsByClassName("char selected")
	while (selected.length)
		selected[0].classList.remove("selected")

	var emotes = Object.keys(puppet.emotes)
	for (var i = 0; i < emotes.length; i++)
		document.getElementById(emotes[i]).className += " available"

	document.getElementById('char ' + project.project.hotbar.indexOf(puppet.name)).className += " selected"
	document.getElementById(puppet.emote).className += " selected"
}

function createPuppet(actor) {
	var puppet = JSON.parse(JSON.stringify(project.characters[actor.name]))
	puppet.position = actor.position
	puppet.emote = actor.emote
	puppet.facingLeft = actor.facingLeft
	if (actor.socket) puppet.socket = actor.socket
	if (actor.id) puppet.id = actor.id
	return puppet
}

function setPuppet(index) {
	if (!hotbar[index]) return

	// Set Puppet
	babble.setPuppet(puppet.id, hotbar[index])
	puppet = hotbar[index]

	// Update Editor
	var available = document.getElementsByClassName("available")
	while (available.length)
		available[0].classList.remove("available")

	var selected = document.getElementsByClassName("char selected")
	while (selected.length)
		selected[0].classList.remove("selected")

	var emotes = Object.keys(puppet.emotes)
	for (var i = 0; i < emotes.length; i++)
		document.getElementById(emotes[i]).className += " available"

	document.getElementById('char ' + project.project.hotbar.indexOf(hotbar[index].name)).className += " selected"

	// Update Project
	project.puppet.name = hotbar[index].name

	// Update Server
	if (server)	{
		server.emit('set puppet', puppet.id, createPuppet(project.puppet))
	}
}

function setEmote(string) {
	// Change Emote
	puppet.changeEmote(string)

	// Update Editor
	var selected = document.getElementsByClassName("emote selected")
	while (selected.length)
		selected[0].classList.remove("selected")

	document.getElementById(string).className += " selected"

	// Update Project
	project.puppet.emote = string

	// Update Server
	if (server) {
		server.emit('set emote', puppet.id, string)
	}
}

function moveLeft() {
	// Move Left
	puppet.moveLeft()

	// Update Project
	project.puppet.facingLeft = puppet.facingLeft
	project.puppet.position = puppet.target

	// Update Server
	if (server)	{
		server.emit('move left', puppet.id)
	}
}

function moveRight() {
	// Move Right
	puppet.moveRight()

	// Update Project
	project.puppet.facingLeft = puppet.facingLeft
	project.puppet.position = puppet.target

	// Update Server
	if (server)	{
		server.emit('move right', puppet.id)
	}
}

function startBabbling() {
	if (puppet.babbling) return
	// Start Babbling
	puppet.setBabbling(true)

	// Update Editor
	document.getElementById('babble').className = "babble selected"

	// Update Server
	if (server)	{
		server.emit('start babbling', puppet.id)
	}
}

function stopBabbling() {
	// Stop Babbling
	puppet.setBabbling(false)

	// Update Editor
	document.getElementById('babble').className = "babble"

	// Update Server
	if (server)	{
		server.emit('stop babbling', puppet.id)
	}
}

function setHotbar(e) {
	var i = e.target.i
	var puppet = e.target.puppet
	if (('' + document.getElementById('char ' + i).className).indexOf('selected') > -1 && puppet === '') {
		document.getElementById('chars').style.display = 'block'
		document.getElementById('charselect').style.display = 'none'
		return
	}
	project.updateHotbar(i, puppet)
	if (puppet === '') {
		hotbar[i] = null
	} else {
		hotbar[i] = babble.createPuppet(project.characters[puppet])
	}
	if (('' + document.getElementById('char ' + i).className).indexOf('selected') > -1) {
		setPuppet(i)
		if (popout)
			popout.webContents.send('keyUp', i + 49)
	}
	document.getElementById('char ' + i).getElementsByClassName('desc')[0].innerHTML = puppet	
	document.getElementById('chars').style.display = 'block'
	document.getElementById('charselect').style.display = 'none'
}

for (var i = 0; i < 9; i++) {
	var element = document.getElementById('char ' + i)
	element.i = i
	element.addEventListener('click', function(e) {
		var i = e.target.i
		setPuppet(i)
		if (popout)
			popout.webContents.send('keyUp', i + 49)
	})
	element.addEventListener('contextmenu', function(e) {
		var i = e.target.i
		document.getElementById('chars').style.display = 'none'
		document.getElementById('charselect').style.display = 'block'
		document.getElementById('char selected').getElementsByClassName('desc')[0].innerHTML = project.project.hotbar[i]
		var charList = document.getElementById('char list')
		charList.innerHTML = ''
		var characters = Object.keys(project.characters)
		for (var j = 0; j < characters.length; j++) {
			var selector = document.createElement('div')
			selector.id = characters[j].toLowerCase()
			selector.className = "char"
			charList.appendChild(selector)
			selector.innerHTML = '<div class="desc">' + characters[j] + '</div>'
			document.getElementById('char null').i = i
			selector.i = i
			selector.puppet = characters[j]
			if (project.project.hotbar.indexOf(characters[j]) > -1) {
				selector.className += " disabled"
			} else {
				selector.addEventListener('click', setHotbar)
			}
		}
	})
	element.getElementsByClassName('desc')[0].innerHTML = project.project.hotbar[i]
}

document.getElementById('char null').addEventListener('click', setHotbar)
document.getElementById('char null').puppet = ''

document.getElementById('char search').addEventListener('keyup', (e) => {
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
})

document.getElementById('char selected').addEventListener('click', () => {
	document.getElementById('chars').style.display = 'block'
	document.getElementById('charselect').style.display = 'none'
})

for (var i = 0; i < emotes.length; i++) {
	(function() {
		var emote = emotes[i]
		document.getElementById(emotes[i]).addEventListener('click', function() {
			setEmote(emote)
			if (popout)
				switch (emote) {
					default: popout.webContents.send('keyUp', 'u'); break;
					case 'happy': popout.webContents.send('keyUp', 'i'); break;
					case 'wink': popout.webContents.send('keyUp', 'o'); break;
					case 'kiss': popout.webContents.send('keyUp', 'p'); break;
					case 'angry': popout.webContents.send('keyUp', 'j'); break;
					case 'sad': popout.webContents.send('keyUp', 'k'); break;
					case 'ponder': popout.webContents.send('keyUp', 'l'); break;
					case 'gasp': popout.webContents.send('keyUp', ';'); break;
					case 'veryangry': popout.webContents.send('keyUp', 'm'); break;
					case 'verysad': popout.webContents.send('keyUp', ','); break;
					case 'confused': popout.webContents.send('keyUp', '.'); break;
					case 'ooo': popout.webContents.send('keyUp', '/'); break;
				}
		})
	}())
}

document.getElementById('greenscreen').addEventListener('click', () => {
	var style = document.getElementById('screen').style
	if (style.backgroundColor == '')
		style.backgroundColor = project.project.greenScreen
	else 
		style.backgroundColor = ''
})

function popIn() {
	popout.close()
}

function popOut() {
	popout = new BrowserWindow({frame: false, parent: remote.getCurrentWindow(), backgroundColor: project.project.greenScreen, transparent: project.project.transparent})
	// popout.setIgnoreMouseEvents(true)
	popout.on('close', () => {
		document.getElementById('popout').innerHTML = 'Pop Out Show Panel'
		document.getElementById('popout').addEventListener('click', popOut)
		document.getElementById('popout').removeEventListener('click', popIn)
		document.getElementById('screen').removeEventListener('click', popIn)
		document.getElementById('screen').className = 'container main'
		document.getElementById('screen').innerHTML = ''
		babble.reattach('screen')
		//babble.clearPuppets()
		//loadPuppets()
		popout = null
	})
	popout.loadURL(url.format({
		pathname: path.join(__dirname, '../popout.html'),
		protocol: 'file:',
		slashes: true
	  }))
	popout.webContents.openDevTools()
	document.getElementById('popout').innerHTML ='Close Pop Out'
	document.getElementById('popout').removeEventListener('click', popOut)
	document.getElementById('popout').addEventListener('click', popIn)
	document.getElementById('screen').addEventListener('click', popIn)
	document.getElementById('screen').className = 'container main button'
	document.getElementById('screen').innerHTML = '<div style="position: relative;top: 50%;transform: translateY(-50%);text-align:center;background-color:#242a33;">Click to Pop In Show Panel</div>'
}

document.getElementById('popout').addEventListener('click', popOut)

document.getElementById('settings').addEventListener('click', () => {
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
})

document.getElementById('colorpicker').addEventListener('change', (e) => {
	project.project.greenScreen = e.target.value
	if (document.getElementById('screen').style.backgroundColor != '')
		document.getElementById('screen').style.backgroundColor = project.project.greenScreen
})

document.getElementById('transparent').addEventListener('click', (e) => {
	project.project.transparent = e.target.checked
})

document.getElementById('minslotwidth').addEventListener('change', (e) => {
	project.project.minSlotWidth = parseInt(e.target.value)
	babble.resize()
	if (popout)
		popout.webContents.send('resize')
})

document.getElementById('numslots').addEventListener('change', (e) => {
	project.project.numCharacters = parseInt(e.target.value)
	babble.resize()
	if (popout)
		popout.webContents.send('resize')
	if (server)
		server.emit('set slots', project.project.numCharacters)
})

document.getElementById('ip').addEventListener('change', (e) => {
	project.project.ip = e.target.value
})

document.getElementById('port').addEventListener('change', (e) => {
	project.project.port = parseInt(e.target.value)
})

function stopNetworking() {
	babble.clearPuppets()
	puppet = babble.addPuppet(createPuppet(project.puppet), 1)
	server.close()
	server = null
	numPuppets = 1
	document.getElementById('host').innerHTML = 'Host Server'
	document.getElementById('connect').innerHTML = 'Connect to Server'
	if (popout)
		popout.webContents.send('disconnect')
}

document.getElementById('host').addEventListener('click', () => {
	if (server) {
		if (server.connected) {
			server.disconnect()
		} else {
			server.close()
			stopNetworking()
			return
		}
	}

	document.getElementById('host').innerHTML = 'Close Server'
	puppets = []

	// Load requirements
	const io = require('socket.io')

	// Create server & socket
	var serv = http.createServer(function(req, res) {
		// Send HTML headers and message
		res.writeHead(404, {'Content-Type': 'text/html'})
		res.end('<h1>404</h1>')
	})
	serv.listen(project.project.port)
	server = io.listen(serv)
	if (popout)
		popout.webContents.send('connect')

	// Add a connect listener
	server.sockets.on('connection', function(socket) {
		// Send list of assets
		var tabs = Object.keys(project.assets)
		for (var i = 0; i < tabs.length; i++) {
			var assetKeys = Object.keys(project.assets[tabs[i]])
			for (var j = 0; j < assetKeys.length; j++) {
				socket.emit('add asset', tabs[i], assetKeys[j])
			}
		}

		// Add Application Listeners
		socket.on('add puppet', (puppet) => {
			socket.emit('set slots', project.project.numCharacters)
			puppet.socket = socket.id
			numPuppets++
			babble.addPuppet(createPuppet(puppet), numPuppets)
			puppet.id = numPuppets
			project.puppet.id = 1
			socket.emit('add puppet', project.puppet)
			for (var i = 0; i < puppets.length; i++) {
				socket.emit('add puppet', puppets[i])
			}
			puppets.push(puppet)
			socket.emit('assign puppet', numPuppets)
			socket.broadcast.emit('add puppet', puppet)
			if (popout)
				popout.webContents.send('add puppet', puppet)
		})
		socket.on('set puppet', (id, puppet) => {
			babble.setPuppet(id, babble.createPuppet(puppet))
			socket.broadcast.emit('set puppet', id, puppet)
			if (popout)
				popout.webContents.send('set puppet', id, puppet)
			for (var i = 0; i < puppets.length; i++) {
				if (puppets[i].id == id) {
					puppet.socket = puppets[i].socket
					puppet.id = puppets[i].id
					puppets[i] = puppet
					break
				}
			}
		})
		socket.on('set emote', (id, emote) => {
			babble.getPuppet(id).changeEmote(emote)
			socket.broadcast.emit('set emote', id, emote)
			if (popout)
				popout.webContents.send('set emote', id, emote)
			for (var i = 0; i < puppets.length; i++) {
				if (puppets[i].id == id) {
					puppets[i].emote = emote
					break
				}
			}
		})
		socket.on('move left', (id) => {
			var puppet = babble.getPuppet(id)
			puppet.moveLeft()
			socket.broadcast.emit('move left', id)
			if (popout)
				popout.webContents.send('move left', id)
			for (var i = 0; i < puppets.length; i++) {
				if (puppets[i].id == id) {
					puppets[i].position = puppet.target
					puppets[i].facingLeft = puppet.facingLeft
					break
				}
			}
		})
		socket.on('move right', (id) => {
			var puppet = babble.getPuppet(id)
			puppet.moveRight()
			socket.broadcast.emit('move right', id)
			if (popout)
				popout.webContents.send('move right', id)
			for (var i = 0; i < puppets.length; i++) {
				if (puppets[i].id == id) {
					puppets[i].position = puppet.target
					puppets[i].facingLeft = puppet.facingLeft
					break
				}
			}
		})
		socket.on('start babbling', (id) => {
			babble.getPuppet(id).setBabbling(true)
			socket.broadcast.emit('start babbling', id)
			if (popout)
				popout.webContents.send('start babbling', id)
		})
		socket.on('stop babbling', (id) => {
			babble.getPuppet(id).setBabbling(false)
			socket.broadcast.emit('stop babbling', id)
			if (popout)
				popout.webContents.send('stop babbling', id)
		})
		socket.on('set slots', (slots) => {
			project.project.numCharacters = slots
			document.getElementById('numslots').value = slots
			babble.resize()
			socket.broadcast.emit('set slots', slots)
			if (popout)
				popout.webContents.send('resize')
		})

		socket.on('disconnect', () => {
			for (var i = 0; i < puppets.length; i++) {
				if (puppets[i].socket === socket.id) {
					server.emit('remove puppet', puppets[i].id)
					if (popout)
						popout.webContents.send('remove puppet', puppets[i].id)
					babble.removePuppet(puppets[i].id)
					puppets.splice(i, 1)
					break
				}
			}
		})

		socket.on('add asset', (tab, asset) => {
			if (!(project.assets[tab] && project.assets[tab][asset])) {
				var stream = ss.createStream()
				fs.ensureDirSync(path.join(project.assetsPath, tab))
				ss(socket).emit('request asset', stream, tab, asset)
				stream.on('end', () => {
					if (!project.assets[tab])
						project.assets[tab] = {}
					project.assets[tab][asset] = {"location": path.join(tab, asset + '.png')}
					project.addAsset(tab, asset)
					babble.addAsset(tab, asset)
					if (popout)
						popout.webContents.send('add asset', tab, asset)
					socket.broadcast.emit('add asset', tab, asset)
				})
				stream.pipe(fs.createWriteStream(path.join(project.assetsPath, tab, asset + '.png')))
			}
		})
		ss(socket).on('request asset', function(stream, tab, asset) {
			fs.createReadStream(path.join(project.assetsPath, project.assets[tab][asset].location)).pipe(stream)
		})
	})
})

document.getElementById('connect').addEventListener('click', () => {
	if (server) {
		if (server.connected) {
			server.disconnect()
			return
		} 
		server.close()
		document.getElementById('host').innerHTML = 'Host Server'
	}

	document.getElementById('connect').innerHTML = 'Disconnect from Server'

	// Connect to server
	var io = require('socket.io-client')
	var socket = io.connect('http://' + project.project.ip + ':' + project.project.port, {reconnect: true, transports: ['websocket', 'xhr-polling']})
	server = socket

	// Add a connect listener
	socket.on('connect', function() {
		puppets = []
	    socket.emit('add puppet', project.puppet)
		// Send list of assets
		var tabs = Object.keys(project.assets)
		for (var i = 0; i < tabs.length; i++) {
			var assetKeys = Object.keys(project.assets[tabs[i]])
			for (var j = 0; j < assetKeys.length; j++) {
				socket.emit('add asset', tabs[i], assetKeys[j])
			}
		}
	    babble.clearPuppets()
		if (popout)
			popout.webContents.send('connect')
	})

	socket.on('disconnect', stopNetworking)

	// Add Application Listeners
	socket.on('assign puppet', (id) => {
		puppet = babble.addPuppet(createPuppet(project.puppet), id)
		if (popout)
			popout.webContents.send('assign puppet', id)
	})
	socket.on('add puppet', (puppet) => {
		babble.addPuppet(createPuppet(puppet), puppet.id)
		if (popout)
			popout.webContents.send('add puppet', puppet)
		puppets.push(puppet)
	})
	socket.on('set puppet', (id, puppet) => {
		console.log(puppet, project.assets)
		babble.setPuppet(id, babble.createPuppet(puppet))
		if (popout)
			popout.webContents.send('set puppet', id, puppet)
		for (var i = 0; i < puppets.length; i++) {
			if (puppets[i].id == id) {
				puppet.socket = puppets[i].socket
				puppet.id = puppets[i].id
				puppets[i] = puppet
				break
			}
		}
	})
	socket.on('set emote', (id, emote) => {
		babble.getPuppet(id).changeEmote(emote)
		if (popout)
			popout.webContents.send('set emote', id, emote)
		for (var i = 0; i < puppets.length; i++) {
			if (puppets[i].id == id) {
				puppets[i].emote = emote
				break
			}
		}
	})
	socket.on('move left', (id) => {
		babble.getPuppet(id).moveLeft()
		if (popout)
			popout.webContents.send('move left', id)
		for (var i = 0; i < puppets.length; i++) {
			if (puppets[i].id == id) {
				puppets[i].position = puppet.target
				puppets[i].facingLeft = puppet.facingLeft
				break
			}
		}
	})
	socket.on('move right', (id) => {
		babble.getPuppet(id).moveRight()
		if (popout)
			popout.webContents.send('move right', id)
		for (var i = 0; i < puppets.length; i++) {
			if (puppets[i].id == id) {
				puppets[i].position = puppet.target
				puppets[i].facingLeft = puppet.facingLeft
				break
			}
		}
	})
	socket.on('start babbling', (id) => {
		babble.getPuppet(id).setBabbling(true)
		if (popout)
			popout.webContents.send('start babbling', id)
	})
	socket.on('stop babbling', (id) => {
		babble.getPuppet(id).setBabbling(false)
		if (popout)
			popout.webContents.send('stop babbling', id)
	})
	socket.on('remove puppet', (id) => {
		babble.removePuppet(id)
		if (popout)
			popout.webContents.send('remove puppet', id)
		for (var i = 0; i < puppets.length; i++) {
			if (puppets[i].id == id) {
				puppets.splice(i, 1)
				break
			}
		}
	})
	socket.on('set slots', (slots) => {
		project.project.numCharacters = slots
		document.getElementById('numslots').value = slots
		babble.resize()
		if (popout)
			popout.webContents.send('resize')
	})
	socket.on('add asset', (tab, asset) => {
		console.log(tab, asset)
		if (!(project.assets[tab] && project.assets[tab][asset])) {
			var stream = ss.createStream()
			fs.ensureDirSync(path.join(project.assetsPath, tab))
			ss(socket).emit('request asset', stream, tab, asset)
			stream.on('end', () => {
				console.log('finished', tab, asset)
				if (!project.assets[tab])
					project.assets[tab] = {}
				project.assets[tab][asset] = {"location": path.join(tab, asset + '.png')}
				project.addAsset(tab, asset)
				babble.addAsset(tab, asset)
				if (popout)
					popout.webContents.send('add asset', tab, asset)
			})
			stream.pipe(fs.createWriteStream(path.join(project.assetsPath, tab, asset + '.png')))
		}
	})
	ss(socket).on('request asset', function(stream, tab, asset) {
		console.log('request asset', tab, asset)
		fs.createReadStream(path.join(project.assetsPath, project.assets[tab][asset].location)).pipe(stream)
	})
})

window.onkeydown = function(e) {
	var key = e.keyCode ? e.keyCode : e.which

	if (e.target && (e.target.type === 'number' || e.target.type === 'text' || e.target.type === 'search'))
		return

	if (key == 32) {
		startBabbling()
		if (e.preventDefault) e.preventDefault()
	}

	if (popout) 
		popout.webContents.send('keyDown', key)
}

window.onkeyup = function(e) {
	var key = e.keyCode ? e.keyCode : e.which

	if (e.target && (e.target.type === 'number' || e.target.type === 'text'))
		return

	if (key > 48 && key < 58) {
		if (project.project.hotbar.length > key - 49) {
			setPuppet(key - 49)
		}
	} else if (key == 85) setEmote('default')
	else if (key == 73) setEmote('happy')
	else if (key == 79) setEmote('wink')
	else if (key == 80) setEmote('kiss')
	else if (key == 74) setEmote('angry')
	else if (key == 75) setEmote('sad')
	else if (key == 76) setEmote('ponder')
	else if (key == 186) setEmote('gasp')
	else if (key == 77) setEmote('veryangry')
	else if (key == 188) setEmote('verysad')
	else if (key == 190) setEmote('confused')
	else if (key == 191) setEmote('ooo')
	else if (key == 37) moveLeft()
	else if (key == 39) moveRight()
	else if (key == 32) stopBabbling()

	if (popout)
		popout.webContents.send('keyUp', key)
}

// Handle input events from popout
electron.ipcRenderer.on('keyDown', (event, key) => {
	window.onkeydown({"keyCode": key})
})
electron.ipcRenderer.on('keyUp', (event, key) => {
	window.onkeyup({"keyCode": key})
})

electron.ipcRenderer.on('init', () => {
	popout.webContents.send('init', puppets)
})

// Load settings values
document.getElementById('colorpicker').value = project.project.greenScreen
document.getElementById('transparent').checked = project.project.transparent
document.getElementById('minslotwidth').value = project.project.minSlotWidth
document.getElementById('numslots').value = project.project.numCharacters
document.getElementById('ip').value = project.project.ip
document.getElementById('port').value = project.project.port
