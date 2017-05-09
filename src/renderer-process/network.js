// Imports
const controller = require('./controller.js')
const status = require('./status.js')
const ss = require('socket.io-stream')
const io = require('socket.io')
const ioClient = require('socket.io-client')
const http = require('http')
const fs = require('fs-extra')
const path = require('path')

// Vars
var project
var server
var puppets = []
var numPuppets = 1
var addPuppet

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

	status.log('Starting host...')
	document.getElementById('host').innerHTML = 'Close Server'
	puppets = []

	// Create server & socket
	var serv = http.createServer(function(req, res) {
		// Send HTML headers and message
		res.writeHead(404, {'Content-Type': 'text/html'})
		res.end('<h1>404</h1>')
	})
	serv.listen(project.project.port)
	server = io.listen(serv)
	controller.host()

	// Add a connect listener
	server.sockets.on('connection', function(socket) {
		// Send list of assets
		var tabs = Object.keys(project.assets)
		for (var i = 0; i < tabs.length; i++) {
			var assetKeys = Object.keys(project.assets[tabs[i]])
			for (var j = 0; j < assetKeys.length; j++) {
				var asset = project.assets[tabs[i]][assetKeys[j]]
				socket.emit('add asset', {"tab": tabs[i], "hash": assetKeys[j], "name": asset.name})
			}
		}

		// Add Application Listeners
		socket.on('add puppet', (puppet) => {
			socket.emit('set slots', project.project.numCharacters)
			var ourPuppet = project.getPuppet()
			ourPuppet.charId = 1
			socket.emit('add puppet', ourPuppet)
			for (var i = 0; i < puppets.length; i++) {
				socket.emit('add puppet', puppets[i])
			}
			addPuppet = puppet
			if (!status.getCount("Retrieving %x Asset%s") || status.getCount("Retrieving %x Asset%s") === 0)
				addPuppetServer(socket)
		})
		socket.on('set puppet', (id, puppet) => {
			controller.setPuppet(id, puppet)
			socket.broadcast.emit('set puppet', id, puppet)
			for (var i = 0; i < puppets.length; i++) {
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
			for (var i = 0; i < puppets.length; i++) {
				if (puppets[i].charId == id) {
					puppets[i].emote = emote
					break
				}
			}
		})
		socket.on('move left', (id) => {
			var puppet = controller.moveLeft(id)
			socket.broadcast.emit('move left', id)
			for (var i = 0; i < puppets.length; i++) {
				if (puppets[i].charId == id) {
					puppets[i].position = puppet.target
					puppets[i].facingLeft = puppet.facingLeft
					break
				}
			}
		})
		socket.on('move right', (id) => {
			controller.moveRight(id)
			var puppet = socket.broadcast.emit('move right', id)
			for (var i = 0; i < puppets.length; i++) {
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
		socket.on('set slots', (slots) => {
			project.project.numCharacters = slots
			document.getElementById('numslots').value = slots
			controller.resize()
			socket.broadcast.emit('set slots', slots)
		})
		socket.on('move asset', (tab, asset, newTab) => {
			controller.moveAssetLocal(tab, asset, newTab)
			socket.broadcast.emit('move asset', tab, asset, newTab)
		})
		socket.on('delete asset', (tab, asset) => {
			controller.deleteAssetLocal(tab, asset)
			socket.broadcast.emit('delete asset', tab, asset)
		})

		socket.on('disconnect', () => {
			for (var i = 0; i < puppets.length; i++) {
				if (puppets[i].socket === socket.id) {
					server.emit('remove puppet', puppets[i].charId)
					controller.removePuppet(puppets[i].charId)
					puppets.splice(i, 1)
					break
				}
			}
		})

		socket.on('add asset', (asset) => {
			if (!(project.assets[asset.tab] && project.assets[asset.tab][asset.hash])) {
				status.increment('Retrieving %x Asset%s')
				var stream = ss.createStream()
				fs.ensureDirSync(path.join(project.assetsPath, asset.tab))
				ss(socket).emit('request asset', stream, asset)
				stream.on('end', () => {
					controller.addAssetLocal(asset)
					socket.broadcast.emit('add asset', asset)
					if (status.decrement('Retrieving %x Asset%s')) {
						status.log('Synced Assets!')
						if (addPuppet)
							addPuppetServer(socket)
					}
				})
				stream.pipe(fs.createWriteStream(path.join(project.assetsPath, asset.tab, asset.hash + '.png')))
			}
		})
		ss(socket).on('request asset', requestAsset)
	})

	server.sockets.on('error', (e) => {
		status.error('Server Error.', e)
	})

	status.log('Hosting successful!')
}

exports.connect = function() {
	if (server) {
		if (server.io) {
			stopNetworking()
			return
		}
		stopNetworking()
	}

	status.log('Connecting to server...')
	document.getElementById('connect').innerHTML = 'Disconnect from Server'

	// Connect to server
	var socket = ioClient.connect('http://' + project.project.ip + ':' + project.project.port, {reconnect: true, transports: ['websocket', 'xhr-polling']})
	server = socket

	// Add a connect listener
	socket.on('connect', function() {
		puppets = []
		// Send list of assets
		var tabs = Object.keys(project.assets)
		for (var i = 0; i < tabs.length; i++) {
			var assetKeys = Object.keys(project.assets[tabs[i]])
			for (var j = 0; j < assetKeys.length; j++) {
				var asset = project.assets[tabs[i]][assetKeys[j]]
				socket.emit('add asset', {"tab": tabs[i], "hash": assetKeys[j], "name": asset.name})
			}
		}
	    socket.emit('add puppet', project.getPuppet())
		controller.connect()
		status.log('Connected to server!')
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
		status.log('Reconnected.')
	})

	socket.on('reconnecting', () => {
		status.log('Reconnecting...')
	})

	socket.on('reconnect_error', (e) => {
		status.error('Failed to reconnect.', e)
	})

	socket.on('recconect_failed', (e) => {
		status.error('Failed to reconnect.', e)
		stopNetworking()
	})

	// Add Application Listeners
	socket.on('assign puppet', (id) => {
		controller.assign(id)
	})
	socket.on('add puppet', (puppet) => {
		addPuppet = puppet
		if (!status.getCount("Retrieving %x Asset%s") || status.getCount("Retrieving %x Asset%s") === 0)
			addPuppetClient(socket)
	})
	socket.on('set puppet', (id, puppet) => {
		controller.setPuppet(id, puppet)
		for (var i = 0; i < puppets.length; i++) {
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
		for (var i = 0; i < puppets.length; i++) {
			if (puppets[i].charId == id) {
				puppets[i].emote = emote
				break
			}
		}
	})
	socket.on('move left', (id) => {
		var puppet = controller.moveLeft(id)
		for (var i = 0; i < puppets.length; i++) {
			if (puppets[i].charId == id) {
				puppets[i].position = puppet.target
				puppets[i].facingLeft = puppet.facingLeft
				break
			}
		}
	})
	socket.on('move right', (id) => {
		var puppet = controller.moveRight(id)
		for (var i = 0; i < puppets.length; i++) {
			if (puppets[i].charId == id) {
				puppets[i].position = puppet.target
				puppets[i].facingLeft = puppet.facingLeft
				break
			}
		}
	})
	socket.on('start babbling', controller.startBabbling)
	socket.on('stop babbling', controller.stopBabbling)
	socket.on('remove puppet', (id) => {
		controller.removePuppet(id)
		for (var i = 0; i < puppets.length; i++) {
			if (puppets[i].charId == id) {
				puppets.splice(i, 1)
				break
			}
		}
	})
	socket.on('set slots', (slots) => {
		project.project.numCharacters = slots
		document.getElementById('numslots').value = slots
		controller.resize()
	})
	socket.on('move asset', controller.moveAssetLocal)
	socket.on('delete asset', controller.deleteAssetLocal)
	socket.on('add asset', (asset) => {
		if (!(project.assets[asset.tab] && project.assets[asset.tab][asset.hash])) {
			status.increment('Retrieving %x Asset%s')
			var stream = ss.createStream()
			fs.ensureDirSync(path.join(project.assetsPath, asset.tab))
			ss(socket).emit('request asset', stream, asset)
			stream.on('end', () => {
				controller.addAssetLocal(asset)
				if (status.decrement('Retrieving %x Asset%s')) {
					status.log('Synced Assets!')
					if (addPuppet)
							addPuppetServer(socket)
				}
			})
			stream.pipe(fs.createWriteStream(path.join(project.assetsPath, asset.tab, asset.hash + '.png')))
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

function stopNetworking() {
	controller.disconnect()
	server.close()
	server = null
	numPuppets = 1
	document.getElementById('host').innerHTML = 'Host Server'
	document.getElementById('connect').innerHTML = 'Connect to Server'
	status.log('Disconnected.')
}

function requestAsset(stream, asset) {
	fs.createReadStream(path.join(project.assetsPath, project.assets[asset.tab][asset.hash].location)).pipe(stream)
}

function addPuppetServer(socket) {
	numPuppets++
	addPuppet.socket = socket.id
	addPuppet.charId = numPuppets
	controller.addPuppet(addPuppet)
	puppets.push(addPuppet)
	socket.emit('assign puppet', numPuppets)
	socket.broadcast.emit('add puppet', addPuppet)
	addPuppet = null
}

function addPuppetClient() {
	controller.addPuppet(addPuppet)
	puppets.push(addPuppet)
	addPuppet = null
}
