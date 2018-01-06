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
let puppets = []
let numPuppets = 1
let puppetsToAdd = []

exports.init = function() {
	project = require('electron').remote.getGlobal('project').project
}

exports.host = function() {
	if (server) {
		if (!server.io) {
			stopNetworking()
			return
		}
		stopNetworking()
	}

	status.log('Starting host...', 2, 1)
	document.getElementById('host').innerHTML = 'Close Server'
	puppets = []

	// Create server & socket
	let serv = http.createServer(function(req, res) {
		// Send HTML headers and message
		res.writeHead(404, {'Content-Type': 'text/html'})
		res.end('<h1>404</h1>')
	})
	serv.listen(project.project.port)
	server = io.listen(serv)
	controller.host()

	// Add a connect listener
	server.sockets.on('connection', function(socket) {
		// Send project settings
		socket.emit('set scale', project.project.puppetScale)
		socket.emit('set slots', project.project.numCharacters)
		socket.emit('serverVersion', project.project.clientVersion)

		// Send list of assets
		let keys = Object.keys(project.assets)
		for (let i = 0; i < keys.length; i++) {
			let asset = JSON.parse(JSON.stringify((project.assets[keys[i]])))
			socket.emit('add asset', keys[i], asset)
		}

		// Add Application Listeners
		socket.on('add puppet', (puppet) => {
			let ourPuppet = project.getPuppet()
			ourPuppet.charId = 1
			socket.emit('add puppet', ourPuppet)
			for (let i = 0; i < puppets.length; i++) {
				socket.emit('add puppet', puppets[i])
			}
			numPuppets++
			puppet.socket = socket.id
			puppet.charId = numPuppets
			controller.addPuppet(puppet)
			puppets.push(puppet)
			socket.emit('assign puppet', numPuppets)
			socket.broadcast.emit('add puppet', puppet)
		})
		socket.on('set puppet', (id, puppet) => {
			controller.setPuppet(id, puppet)
			socket.broadcast.emit('set puppet', id, puppet)
			for (let i = 0; i < puppets.length; i++) {
				if (puppets[i].charId == id) {
					puppet.socket = puppets[i].socket
					puppet.charId = puppets[i].charId
					puppets[i] = puppet
					break
				}
			}
		})
		socket.on('set emote', (id, emote) => {
			controller.setEmote(id, emote)
			socket.broadcast.emit('set emote', id, emote)
			for (let i = 0; i < puppets.length; i++) {
				if (puppets[i].charId == id) {
					puppets[i].emote = emote
					break
				}
			}
		})
		socket.on('move left', (id) => {
			let puppet = controller.moveLeft(id)
			socket.broadcast.emit('move left', id)
			for (let i = 0; i < puppets.length; i++) {
				if (puppets[i].charId == id) {
					puppets[i].position = puppet.target
					puppets[i].facingLeft = puppet.facingLeft
					break
				}
			}
		})
		socket.on('move right', (id) => {
			controller.moveRight(id)
			let puppet = socket.broadcast.emit('move right', id)
			for (let i = 0; i < puppets.length; i++) {
				if (puppets[i].charId == id) {
					puppets[i].position = puppet.target
					puppets[i].facingLeft = puppet.facingLeft
					break
				}
			}
		})
		socket.on('start babbling', (id) => {
			controller.startBabbling(id)
			socket.broadcast.emit('start babbling', id)
		})
		socket.on('stop babbling', (id) => {
			controller.stopBabbling(id)
			socket.broadcast.emit('stop babbling', id)
		})
		socket.on('jiggle', (id) => {
			controller.jiggle(id)
			socket.broadcast.emit('jiggle', id)
		})
		socket.on('set scale', (scale) => {
			project.network.puppetScale = scale
			controller.resize()
			socket.broadcast.emit('set scale', scale)
		})
		socket.on('set slots', (slots) => {
			project.network.numCharacters = slots
			controller.resize()
			socket.broadcast.emit('set slots', slots)
		})
		socket.on('move asset', (asset, newTab) => {
			controller.changeAssetTabLocal(asset, newTab)
			socket.broadcast.emit('move asset', asset, newTab)
		})
		socket.on('delete asset', (asset) => {
			controller.deleteAssetLocal(asset)
			socket.broadcast.emit('delete asset', asset)
		})

		socket.on('disconnect', () => {
			for (let i = 0; i < puppets.length; i++) {
				if (puppets[i].socket === socket.id) {
					server.emit('remove puppet', puppets[i].charId)
					controller.removePuppet(puppets[i].charId)
					puppets.splice(i, 1)
					break
				}
			}
		})

		socket.on('add asset', (id, asset) => {
			if (!project.assets[id] || asset.version > project.assets[id].version) {
				status.increment('Retrieving %x Asset%s')
				let stream = ss.createStream()
				fs.ensureDirSync(path.join(project.assetsPath, id.split(':')[0]))
				ss(socket).emit('request asset', stream, id)
				stream.on('end', () => {
					controller.addAssetLocal(id, asset)
					socket.broadcast.emit('add asset', id, asset)
					if (status.decrement('Retrieving %x Asset%s')) {
						status.log('Synced Assets!', 3, 1)
					}
				})
				stream.pipe(fs.createWriteStream(path.join(project.assetsPath, id.split(':')[0], id.split(':')[1] + '.png')))
			}
		})
		ss(socket).on('request asset', requestAsset)
	})

	server.sockets.on('error', (e) => {
		status.error('Server Error.', e)
	})

	status.log('Hosting successful!', 1, 1)
}

exports.connect = function() {
	if (server) {
		if (server.io) {
			stopNetworking()
			return
		}
		stopNetworking()
	}

	status.log('Connecting to server...', 2, 1)
	document.getElementById('connect').innerHTML = 'Disconnect from Server'

	// Connect to server
	let socket = ioClient.connect('http://' + project.project.ip + ':' + project.project.port, {reconnect: true, transports: ['websocket', 'xhr-polling']})
	server = socket

	// Add a connect listener
	socket.on('connect', function() {
		puppets = []
		// Send list of assets
		let keys = Object.keys(project.assets)
		for (let i = 0; i < keys.length; i++) {
			let asset = JSON.parse(JSON.stringify((project.assets[keys[i]])))
			socket.emit('add asset', keys[i], asset)
		}
	    socket.emit('add puppet', project.getPuppet())
		controller.connect()
		status.log('Connected to server!', 1, 1)
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
	socket.on('move asset', controller.changeAssetTabLocal)
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
	return server !== null
}

function stopNetworking() {
	controller.disconnect()
	server.close()
	server = null
	numPuppets = 1
	document.getElementById('host').innerHTML = 'Host Server'
	document.getElementById('connect').innerHTML = 'Connect to Server'
	status.log('Disconnected.', 2, 1)
}

function requestAsset(stream, id) {
	fs.createReadStream(path.join(project.assetsPath, project.assets[id].location)).pipe(stream)
}
