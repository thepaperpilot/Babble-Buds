// Load requirements
const http = require('http')
const path = require('path')
// You'll need to install these using npm:
// e.g. `npm install fs-extra socket.io socket.io-stream`
const fs = require('fs-extra')
const io = require('socket.io')
const ss = require('socket.io-stream')

// Settings
var port = process.env.babblePort || 8080 // Will read port from environment variable "babblePort" or default to 8080
var numCharacters = 5
var puppetScale = 1
var assetsPath = path.join(__dirname, 'assets')
var logLevel = 2 // 0 = No messages, 1 = Connect/Disconnect messages, 2 = Also include puppet changes, 3 = All known commands
var clientVersion = "~0.6.1"	// Clients will need to match this version/range

// Variables
var server
var puppets = []
var assets = {}
var numPuppets = 1
var assetsDownloading = 0

// Create server & socket
if (logLevel >= 1) console.log("Starting server on port " + port + "...")
var serv = http.createServer(function(req, res) {
	// Send HTML headers and message
	res.writeHead(404, {'Content-Type': 'text/html'})
	res.end('<h1>404</h1>')
})
serv.listen(port)
server = io.listen(serv)

// Add a connect listener
if (logLevel >= 1) console.log("Adding listeners...")
server.sockets.on('connection', function(socket) {
	if (logLevel >= 1) console.log("New connection:", socket.id)

	// Send project settings
	socket.emit('set scale', puppetScale)
	socket.emit('set slots', numCharacters)
	socket.emit('serverVersion', clientVersion)

	// Send list of assets
	let keys = Object.keys(assets)
	for (let i = 0; i < keys.length; i++) {
		let asset = JSON.parse(JSON.stringify((assets[keys[i]])))
		socket.emit('add asset', keys[i], asset)
	}

	// Add Application Listeners
	socket.on('add puppet', (puppet) => {
		if (logLevel >= 1) console.log("Received puppet from " + socket.id)
		for (var i = 0; i < puppets.length; i++) {
			socket.emit('add puppet', puppets[i])
		}
		numPuppets++
		puppet.socket = socket.id
		puppet.charId = numPuppets
		puppets.push(puppet)
		socket.emit('assign puppet', numPuppets)
		socket.broadcast.emit('add puppet', puppet)
	})
	socket.on('set puppet', (id, puppet) => {
		if (logLevel >= 2) console.log(socket.id + " changed puppets")
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
		if (logLevel >= 3) console.log(socket.id + " changed to emote " + emote)
		socket.broadcast.emit('set emote', id, emote)
		for (var i = 0; i < puppets.length; i++) {
			if (puppets[i].charId == id) {
				puppets[i].emote = emote
				break
			}
		}
	})
	socket.on('move left', (id) => {
		if (logLevel >= 3) console.log(socket.id + " moved left")
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
		if (logLevel >= 3) console.log(socket.id + " moved right")
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
		if (logLevel >= 3) console.log(socket.id + " started babbling")
		socket.broadcast.emit('start babbling', id)
	})
	socket.on('stop babbling', (id) => {
		if (logLevel >= 3) console.log(socket.id + " stopped babbling")
		socket.broadcast.emit('stop babbling', id)
	})
	socket.on('jiggle', (id) => {
		if (logLevel >= 3) console.log(socket.id + " jiggled")
		socket.broadcast.emit('jiggle', id)
	})
	socket.on('set scale', (scale) => {
		if (logLevel >= 3) console.log(socket.id + " changed the puppetScale to " + scale)
		puppetScale = scale
		socket.broadcast.emit('set scale', scale)
	})
	socket.on('set slots', (slots) => {
		if (logLevel >= 3) console.log(socket.id + " changed the puppetScale to " + slots)
		numCharacters = slots
		socket.broadcast.emit('set slots', slots)
	})
	socket.on('move asset', (tab, asset, newTab) => {
		if (logLevel >= 3) console.log(socket.id + " moved asset " + tab + "-" + asset + " to " + newTab)
		socket.broadcast.emit('move asset', tab, asset, newTab)
	})
	socket.on('delete asset', (tab, asset) => {
		if (logLevel >= 3) console.log(socket.id + " deleted asset " + tab + "-" + asset)
		socket.broadcast.emit('delete asset', tab, asset)
	})

	socket.on('disconnect', () => {
		if (logLevel >= 1) console.log(socket.id + " disconnected.")
		for (var i = 0; i < puppets.length; i++) {
			if (puppets[i].socket === socket.id) {
				server.emit('remove puppet', puppets[i].charId)
				puppets.splice(i, 1)
				break
			}
		}
	})

	socket.on('add asset', (id, asset) => {
		if (logLevel >= 3) console.log("Received new asset " + JSON.stringify(asset) + " from " + socket.id)
		if (!assets[id] || asset.version > assets[id].version) {
			if (logLevel >= 3) console.log("Downloading new asset from " + socket.id)
			assetsDownloading++
			var stream = ss.createStream()
			fs.ensureDirSync(path.join(assetsPath, id.split(':')[0]))
			ss(socket).emit('request asset', stream, id)
			stream.on('end', () => {
				assets[id] = asset
				socket.broadcast.emit('add asset', id, asset)
				assetsDownloading--
			})
			stream.pipe(fs.createWriteStream(path.join(assetsPath, id.split(':')[0], id.split(':')[1] + '.png')))
		}
	})
	ss(socket).on('request asset', function(stream, id) {
		fs.createReadStream(path.join(assetsPath, assets[id].location)).pipe(stream)
	})
})

if (logLevel >= 1) console.log("Started Server!")
