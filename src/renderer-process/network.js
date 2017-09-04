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
let project
let server
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

		// Send list of assets
		let tabs = Object.keys(project.assets)
		for (let i = 0; i < tabs.length; i++) {
			let assetKeys = Object.keys(project.assets[tabs[i]])
			for (let j = 0; j < assetKeys.length; j++) {
				let asset = project.assets[tabs[i]][assetKeys[j]]
				socket.emit('add asset', {"tab": tabs[i], "hash": assetKeys[j], "name": asset.name})
			}
		}

		// Add Application Listeners
		socket.on('add puppet', (puppet) => {
			socket.emit('set slots', project.project.numCharacters)
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
			project.project.puppetScale = scale
			document.getElementById('puppetscale').value = scale
			controller.resize()
			socket.broadcast.emit('set scale', scale)
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
			for (let i = 0; i < puppets.length; i++) {
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
				let stream = ss.createStream()
				fs.ensureDirSync(path.join(project.assetsPath, asset.tab))
				ss(socket).emit('request asset', stream, asset)
				stream.on('end', () => {
					controller.addAssetLocal(asset)
					socket.broadcast.emit('add asset', asset)
					if (status.decrement('Retrieving %x Asset%s')) {
						status.log('Synced Assets!', 3, 1)
						controller.reloadPuppets()
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
		let tabs = Object.keys(project.assets)
		for (let i = 0; i < tabs.length; i++) {
			let assetKeys = Object.keys(project.assets[tabs[i]])
			for (let j = 0; j < assetKeys.length; j++) {
				let asset = project.assets[tabs[i]][assetKeys[j]]
				socket.emit('add asset', {"tab": tabs[i], "hash": assetKeys[j], "name": asset.name})
			}
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
		project.project.puppetScale = scale
		document.getElementById('puppetscale').value = scale
		controller.resize()
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
			let stream = ss.createStream()
			fs.ensureDirSync(path.join(project.assetsPath, asset.tab))
			ss(socket).emit('request asset', stream, asset)
			stream.on('end', () => {
				controller.addAssetLocal(asset)
				if (status.decrement('Retrieving %x Asset%s')) {
					status.log('Synced Assets!', 3, 1)
					controller.reloadPuppets()
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
	status.log('Disconnected.', 2, 1)
}

function requestAsset(stream, asset) {
	fs.createReadStream(path.join(project.assetsPath, project.assets[asset.tab][asset.hash].location)).pipe(stream)
}
