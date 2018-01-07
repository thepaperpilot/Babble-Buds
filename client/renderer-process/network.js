// Imports
const controller = require('./controller.js')
const status = require('./status.js')
const ss = require('socket.io-stream')
const io = require('socket.io')
const ioClient = require('socket.io-client')
const http = require('http')
const fs = require('fs-extra')
const path = require('path')
const semver = require('semver')

// Vars
let project
let server = null
let room = null
let puppets = []

exports.init = function() {
	project = require('electron').remote.getGlobal('project').project
}

exports.join = function() {
	if (room) {
		server.emit('leave room')
		return
	}

	let join = () => {
		server.emit('join room', project.project.roomName, project.project.roomPassword);
		joinRoom()
	}
	if (server) join()
	else exports.connect(join)
}

exports.create = function() {
	if (room) {
		server.emit('leave room')
		return
	}
	
	let create = () => {
		server.emit('create room', project.project.roomName, project.project.roomPassword, project.project.roomPuppetScale, project.project.roomNumCharacters);
		joinRoom()
	}
	if (server) create()
	else exports.connect(create)
}

exports.connect = function(callback) {
	if (server) {
		stopNetworking()
		return
	}

	status.log('Connecting to server...', 2, 1)
	document.getElementById('connect').innerHTML = 'Disconnect from Server'

	// Connect to server
	let socket = ioClient.connect('http://' + project.project.ip + ':' + project.project.port, {reconnect: true, transports: ['websocket', 'xhr-polling']})
	server = socket

	// Add a connect listener
	socket.on('connect', function() {
		status.log('Connected to server!', 1, 1)
		if (callback) callback()
	})

	socket.on('disconnect', stopNetworking)

	socket.on('connect_error', (e) => {
		status.error('Failed to connect.', e)
	})

	socket.on('connect_timeout', (e) => {
		status.error('Connection timed out.', e)
	})

	socket.on('error', (e) => {
		status.error('Server error.', e)
	})

	socket.on('reconnect', () => {
		status.log('Reconnected.', 1, 1)
	})

	socket.on('reconnecting', () => {
		status.log('Reconnecting...', 1, 1)
	})

	socket.on('reconnect_error', (e) => {
		status.error('Failed to reconnect.', e)
	})

	socket.on('recconect_failed', (e) => {
		status.error('Failed to reconnect.', e)
		stopNetworking()
	})

	socket.on('info', (message) => {
		status.log(message, 1, 1)
	})

	socket.on('joined room', (name) => {
		status.log("Joined room \"" + name + "\"")
		room = name
		document.getElementById('connectedMessage').innerText = "Connected to room \"" + room + "\""
		document.getElementById('joinRoom').innerText = "Disconnect from room"
		document.getElementById('createRoom').style.display = 'none'
		document.getElementById('roomSettings').style.display = 'none'
	})

	socket.on('created room', (name) => {
		status.log("Created room \"" + name + "\"")
		room = name
		document.getElementById('connectedMessage').innerText = "Connected to room \"" + room + "\""
		document.getElementById('createRoom').innerText = "Close room"
		document.getElementById('joinRoom').style.display = 'none'
		document.getElementById('roomSettings').style.display = 'none'
		document.getElementById('adminPanel').style.display = ''
	})

	socket.on('leave room', leaveRoom)

	// Add Application Listeners
	socket.on('serverVersion', (version) => {
		if(!semver.intersects(version, project.project.clientVersion)) {
			stopNetworking()
			status.log("Server Version Mismatch! Server required " + version + ", our version: " + project.project.clientVersion, 2, 1)
		}
	})
	socket.on('assign puppet', (id) => {
		controller.assign(id)
	})
	socket.on('add puppet', (puppet) => {
		controller.addPuppet(puppet)
		puppets.push(puppet)
	})
	socket.on('set puppet', (id, puppet) => {
		controller.setPuppet(id, puppet)
		for (let i = 0; i < puppets.length; i++) {
			if (puppets[i].charId == id) {
				puppet.socket = puppets[i].socket
				puppet.id = puppets[i].id
				puppets[i] = puppet
				break
			}
		}
	})
	socket.on('set emote', (id, emote) => {
		controller.setEmote(id, emote)
		for (let i = 0; i < puppets.length; i++) {
			if (puppets[i].charId == id) {
				puppets[i].emote = emote
				break
			}
		}
	})
	socket.on('move left', (id) => {
		let puppet = controller.moveLeft(id)
		for (let i = 0; i < puppets.length; i++) {
			if (puppets[i].charId == id) {
				puppets[i].position = puppet.target
				puppets[i].facingLeft = puppet.facingLeft
				break
			}
		}
	})
	socket.on('move right', (id) => {
		let puppet = controller.moveRight(id)
		for (let i = 0; i < puppets.length; i++) {
			if (puppets[i].charId == id) {
				puppets[i].position = puppet.target
				puppets[i].facingLeft = puppet.facingLeft
				break
			}
		}
	})
	socket.on('start babbling', controller.startBabbling)
	socket.on('stop babbling', controller.stopBabbling)
	socket.on('jiggle', controller.jiggle)
	socket.on('banish', controller.banish)
	socket.on('remove puppet', (id) => {
		controller.removePuppet(id)
		for (let i = 0; i < puppets.length; i++) {
			if (puppets[i].charId == id) {
				puppets.splice(i, 1)
				break
			}
		}
	})
	socket.on('set scale', (scale) => {
		project.network.puppetScale = scale
		controller.resize()
	})
	socket.on('set slots', (slots) => {
		project.network.numCharacters = slots
		controller.resize()
	})
	socket.on('delete asset', controller.deleteAssetLocal)
	socket.on('add asset', (id, asset) => {
		if (!project.assets[id] || asset.version > project.assets[id].version) {
			status.increment('Retrieving %x Asset%s')
			let stream = ss.createStream()
			fs.ensureDirSync(path.join(project.assetsPath, id.split(':')[0]))
			ss(socket).emit('request asset', stream, id)
			stream.on('end', () => {
				controller.addAssetLocal(id, asset)
				if (status.decrement('Retrieving %x Asset%s')) {
					status.log('Synced Assets!', 3, 1)
				}
			})
			stream.pipe(fs.createWriteStream(path.join(project.assetsPath, id.split(':')[0], id.split(':')[1] + '.png')))
		}
	})
	ss(socket).on('request asset', requestAsset)
}

exports.emit = function(...args) {
	if (server)	{
		server.emit(...args)
	}
}

exports.getPuppets = function() {
	return puppets
}

exports.isNetworking = function() {
	return server !== null && room !== null
}

function stopNetworking() {	
	if (!server) return
	server.disconnect()
	server = null
	leaveRoom()
	document.getElementById('connect').innerHTML = 'Connect to Server'
	status.log('Disconnected.', 2, 1)
}

function joinRoom() {
	puppets = []
	// Send list of assets
	let keys = Object.keys(project.assets)
	for (let i = 0; i < keys.length; i++) {
		let asset = JSON.parse(JSON.stringify((project.assets[keys[i]])))
		server.emit('add asset', keys[i], asset)
	}
    server.emit('add puppet', project.getPuppet())
	controller.connect()
}

function leaveRoom() {
	if (!room) return
	status.log("Left room \"" + room + "\"")
	room = null
	document.getElementById('connectedMessage').innerText = ""
	document.getElementById('joinRoom').innerText = "Join room"
	document.getElementById('createRoom').innerText = "Create room"
	document.getElementById('joinRoom').style.display = ''
	document.getElementById('createRoom').style.display = ''
	document.getElementById('roomSettings').style.display = ''
	document.getElementById('adminPanel').style.display = 'none'
	controller.disconnect()
}

function requestAsset(stream, id) {
	fs.createReadStream(path.join(project.assetsPath, project.assets[id].location)).pipe(stream)
}
