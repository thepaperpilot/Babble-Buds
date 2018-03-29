// Imports
const controller = require('./controller.js')
const status = require('./status.js')
const ss = require('socket.io-stream')
const io = require('socket.io')
const ioClient = require('socket.io-client')
const babble = require('babble.js')
const http = require('http')
const fs = require('fs-extra')
const path = require('path')
const semver = require('semver')

// Vars
let project
let server = null
let room = null
let puppets
let users
let stage	// used for creating thumbnails of connected users' puppets
let admin
let host
let myId

exports.init = function() {
	project = require('electron').remote.getGlobal('project').project
	let stageElement = document.createElement('div')
	stageElement.id = 'userThumbnailStage'
	stageElement.className = 'hidden'
	document.body.appendChild(stageElement)
	stage = new babble.Stage('userThumbnailStage', {'numCharacters': 1, 'puppetScale': 1, 'assets': project.project.assets}, project.assets, project.assetsPath, () => {stage.addPuppet(project.getPuppet(), 1)}, status)
}

exports.join = function() {
	if (room) {
		server.emit('leave room')
		return
	}

	let join = () => {
		server.emit('join room', project.project.roomName, project.project.roomPassword);
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
	}
	if (server) create()
	else exports.connect(create)
}

exports.connect = function(callback) {
	if (server) {
		server.disconnect()
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
		if (callback && callback instanceof Function) callback()
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
		joinRoom()
		room = name
		document.getElementById('joinRoom').innerText = "Disconnect from room"
		document.getElementById('createRoom').style.display = 'none'
		document.getElementById('roomName').disabled = true
		document.getElementById('roomPassword').disabled = true
		document.getElementById('connectedPanel').style.display = ''
		document.getElementById('connected list').innerHTML = ''
	})

	socket.on('created room', (name) => {
		status.log("Created room \"" + name + "\"")
		joinRoom()
		room = name
		admin = true
		host = true
		document.getElementById('createRoom').innerText = "Close room"
		document.getElementById('joinRoom').style.display = 'none'
		document.getElementById('roomName').disabled = true
		document.getElementById('adminPanel').style.display = ''
		document.getElementById('connectedPanel').style.display = ''
		document.getElementById('connected list').innerHTML = ''

		project.network.puppetScale = project.project.roomPuppetScale
		project.network.numCharacters = project.project.roomNumCharacters
		controller.resize()
	})

	socket.on('leave room', leaveRoom)

	// Add Application Listeners
	socket.on('serverVersion', (version) => {
		if(!semver.intersects(version, project.project.clientVersion)) {
			stopNetworking()
			status.log("Server Version Mismatch! Server required " + version + ", our version: " + project.project.clientVersion, 2, 1)
		}
	})
	socket.on('assign puppet', (id, isHost) => {
		myId = id
		controller.assign(id)
		addUser(id, project.getPuppet(), project.project.nickname, isHost, isHost)
	})
	socket.on('change nickname', (id, name) => {
		updateUser(id, null, name)
	})
	socket.on('demote', (id) => {
		users[id].selector.classList.remove("promoted")
		users[id].promote.innerText = 'Promote'
		users[id].admin = false
		if (id === myId) {
			admin = false
			document.getElementById('adminPanel').style.display = 'none'
			let keys = Object.keys(users)
			for (let i = 0; i < keys.length; i++) {
				let id = keys[i]
				let user = users[id]
			    user.kick.disabled = !admin || id === myId || user.host || (user.admin && !host)
			}
		}
	})
	socket.on('promote', (id) => {
		users[id].selector.classList.add("promoted")
		users[id].promote.innerText = 'Demote'
		users[id].admin = true
		if (id === myId) {
			admin = true
			document.getElementById('adminPanel').style.display = ''
			let keys = Object.keys(users)
			for (let i = 0; i < keys.length; i++) {
				let id = keys[i]
				let user = users[id]
			    user.kick.disabled = !admin || id === myId || user.host || (user.admin && !host)
			}
		}
	})
	socket.on('change password', (password) => {
		document.getElementById('roomPassword').value = password
	})
	socket.on('add puppet', (puppet, name, isAdmin, isHost) => {
		controller.addPuppet(puppet)
		puppets.push(puppet)
		addUser(puppet.charId, puppet, name, isAdmin, isHost)
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
		updateUser(id, puppet)
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
		document.getElementById('connected list').removeChild(document.getElementById('connected user ' + id))
	})
	socket.on('set scale', (scale) => {
		project.network.puppetScale = scale
		document.getElementById('roomPuppetscale').value = scale
		controller.resize()
	})
	socket.on('set slots', (slots) => {
		document.getElementById('roomNumslots').value = slots
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

exports.changeNickname = function() {
	if (server && myId) {
		updateUser(myId, null, project.project.nickname)
		server.emit('change nickname', myId, project.project.nickname)
	}
}

function stopNetworking() {	
	if (!server) return
	server = null
	leaveRoom()
	document.getElementById('connect').innerHTML = 'Connect to Server'
	status.log('Disconnected.', 2, 1)
}

function joinRoom() {
	puppets = []
	users = {}
	admin = host = false
	myId = null
	// Send list of assets
	let keys = Object.keys(project.assets)
	for (let i = 0; i < keys.length; i++) {
		let asset = JSON.parse(JSON.stringify((project.assets[keys[i]])))
		server.emit('add asset', keys[i], asset)
	}
	controller.connect()
    server.emit('add puppet', project.getPuppet(), project.project.nickname)
}

function leaveRoom() {
	if (!room) return
	status.log("Left room \"" + room + "\"")
	room = null
	document.getElementById('joinRoom').innerText = "Join room"
	document.getElementById('createRoom').innerText = "Create room"
	document.getElementById('joinRoom').style.display = ''
	document.getElementById('createRoom').style.display = ''
	document.getElementById('roomName').disabled = false
	document.getElementById('roomPassword').disabled = false
	document.getElementById('adminPanel').style.display = 'none'
	document.getElementById('connectedPanel').style.display = 'none'
	controller.disconnect()
}

function addUser(id, puppet, name, isAdmin, isHost) {
    let selector = document.createElement('div')
    selector.id = "connected user " + id
    selector.className = "char"
    if (isAdmin) selector.classList.add("promoted")
    if (isHost) selector.classList.add("host")
    if (id === myId) selector.classList.add("selected")
    stage.setPuppet(1, stage.createPuppet(puppet))
    selector.style.backgroundImage = "url('data:image/png;base64, " + stage.getThumbnail() + "')"
    document.getElementById('connected list').appendChild(selector)
    let desc = document.createElement('div')
    desc.className = 'desc'
    desc.innerText = name
    selector.appendChild(desc)
    let hover = document.createElement('div')
    hover.className = 'hover'
    selector.appendChild(hover)
    let kick = document.createElement('button')
    kick.innerText = 'Kick'
    kick.className = 'hover-button'
    kick.addEventListener('click', () => { server.emit('kick user', id) })
    // We can only kick people if:
    // 1. We're a host
    // 2. They're not us
    // 3. They're not the host
    // 4. They're an admin, and we're not the host
    kick.disabled = !admin || id === myId || isHost || (isAdmin && !host)
    hover.appendChild(kick)
    let promote = document.createElement('button')
    promote.innerText = isAdmin ? 'Demote' : 'Promote'
    promote.className = 'hover-button'
    promote.addEventListener('click', () => { server.emit('promote user', id) })
    // We can only promote/demote people if:
    // 1. We're the host
    // 2. They're not us
    promote.disabled = !host || id === myId
    hover.appendChild(promote)

    let user = {
		admin: isAdmin,
		host: isHost,
		selector: selector,
		desc: desc,
		kick: kick,
		promote: promote
	}
	users[id] = user
}

function updateUser(id, puppet, name) {
	let user = users[id]
	if (puppet) {
		stage.setPuppet(1, stage.createPuppet(puppet))
	    user.selector.style.backgroundImage = "url('data:image/png;base64, " + stage.getThumbnail() + "')"
	}
	if (name)
		user.desc.innerText = name
}

function requestAsset(stream, id) {
	fs.createReadStream(path.join(project.assetsPath, project.assets[id].location)).pipe(stream)
}
