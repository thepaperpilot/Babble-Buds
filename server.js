// Load requirements
const http = require('http')
const path = require('path')
// You'll need to install these using npm:
const fs = require('fs-extra')
const io = require('socket.io')
const ss = require('socket.io-stream')

// Settings
var port = 8080
var numCharacters = 5
var assetsPath = path.join(__dirname, 'assets')

// Variables
var server
var puppets = []
var assets = {}
var numPuppets = 1

// Create server & socket
var serv = http.createServer(function(req, res) {
	// Send HTML headers and message
	res.writeHead(404, {'Content-Type': 'text/html'})
	res.end('<h1>404</h1>')
})
serv.listen(port)
server = io.listen(serv)

// Add a connect listener
server.sockets.on('connection', function(socket) {
	// Send list of assets
	var tabs = Object.keys(assets)
	for (var i = 0; i < tabs.length; i++) {
		var assetKeys = Object.keys(assets[tabs[i]])
		for (var j = 0; j < assetKeys.length; j++) {
			socket.emit('add asset', tabs[i], assetKeys[j])
		}
	}

	// Add Application Listeners
	socket.on('add puppet', (puppet) => {
		socket.emit('set slots', numCharacters)
		puppet.socket = socket.id
		numPuppets++
		puppet.charId = numPuppets
		for (var i = 0; i < puppets.length; i++) {
			socket.emit('add puppet', puppets[i])
		}
		puppets.push(puppet)
		socket.emit('assign puppet', numPuppets)
		socket.broadcast.emit('add puppet', puppet)
	})
	socket.on('set puppet', (id, puppet) => {
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
		socket.broadcast.emit('set emote', id, emote)
		for (var i = 0; i < puppets.length; i++) {
			if (puppets[i].charId == id) {
				puppets[i].emote = emote
				break
			}
		}
	})
	socket.on('move left', (id) => {
		socket.broadcast.emit('move left', id)
		for (var i = 0; i < puppets.length; i++) {
			if (puppets[i].charId == id) {
				if (puppets[i].facingLeft)
					puppets[i].position--
				else
					puppets[i].facingLeft = true
				break
			}
		}
	})
	socket.on('move right', (id) => {
		socket.broadcast.emit('move right', id)
		for (var i = 0; i < puppets.length; i++) {
			if (puppets[i].charId == id) {
				if (puppets[i].facingLeft)
					puppets[i].facingLeft = true
				else
					puppets[i].position++
				break
			}
		}
	})
	socket.on('start babbling', (id) => {
		socket.broadcast.emit('start babbling', id)
	})
	socket.on('stop babbling', (id) => {
		socket.broadcast.emit('stop babbling', id)
	})
	socket.on('set slots', (slots) => {
		numCharacters = slots
		socket.broadcast.emit('set slots', slots)
	})

	socket.on('disconnect', () => {
		for (var i = 0; i < puppets.length; i++) {
			if (puppets[i].socket === socket.id) {
				server.emit('remove puppet', puppets[i].charId)
				puppets.splice(i, 1)
				break
			}
		}
	})

	socket.on('add asset', (tab, asset) => {
		if (!(assets[tab] && assets[tab][asset])) {
			var stream = ss.createStream()
			fs.ensureDirSync(path.join(assetsPath, tab))
			ss(socket).emit('request asset', stream, tab, asset)
			stream.on('end', () => {
				if (!assets[tab])
					assets[tab] = {}
				assets[tab][asset] = {"location": path.join(tab, asset + '.png')}
				socket.broadcast.emit('add asset', tab, asset)
			})
			stream.pipe(fs.createWriteStream(path.join(assetsPath, tab, asset + '.png')))
		}
	})
	ss(socket).on('request asset', function(stream, tab, asset) {
		fs.createReadStream(path.join(assetsPath, assets[tab][asset].location)).pipe(stream)
	})
})
