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
var assetsPath = path.join(__dirname, 'assets')
var logLevel = 2 // 0 = No messages, 1 = Connect/Disconnect messages, 2 = Also include puppet changes, 3 = All known commands
var clientVersion = "~0.8.0"	// Clients will need to match this version/range

// Variables
var server
var rooms = {}

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

	// Send server version, to ensure client version is compatible
	socket.emit('serverVersion', clientVersion)

	// Add Application Listeners
	socket.on('join room', (name, password) => {
		if (socket.room) {
			socket.emit('info', 'Already in a room')
			return
		}

		if (!rooms[name] || rooms[name].password !== password) {
			socket.emit('info', 'Wrong password or room does not exist.')
			return
		}

		socket.join(name)
		socket.room = name
		socket.emit('joined room', name)
		if (logLevel >= 1) console.log(socket.id + " joined room:", name)

		// Send room settings
		let room = rooms[name]
		socket.emit('set scale', room.puppetScale)
		socket.emit('set slots', room.numCharacters)

		// Send list of assets
		let keys = Object.keys(room.assets)
		for (let i = 0; i < keys.length; i++) {
			let asset = JSON.parse(JSON.stringify((room.assets[keys[i]])))
			socket.emit('add asset', keys[i], asset)
		}
	})
	socket.on('create room', (name, password, puppetScale, numCharacters) => {
		if (socket.room) {
			socket.emit('info', 'Already in a room')
			return
		}

		if (rooms[name]) {
			socket.emit('info', 'Room already exists')
			return
		}

		socket.join(name)
		socket.room = name
		rooms[name] = {
			host: socket.id,
			admins: [socket.id],
			password: password,
			puppetScale: puppetScale,
			numCharacters: numCharacters,
			puppets: [],
			names: [],
			assets: {},
			numPuppets: 0
		}
		socket.emit('created room', name)
		if (logLevel >= 1) console.log(socket.id + " created room:", name)
	})
	socket.on('leave room', () => {
		leaveRoom(socket)
	})
	socket.on('change nickname', (id, name) => {
		let room = rooms[socket.room]
		if (!socket.room || !room) return
		if (logLevel >= 2) console.log(socket.id + "changed their nickname to " + name)
		for (let i = 0; i < room.puppets.length; i++) {
			if (room.puppets[i].charId == id) {
				room.names[i] = name
				break
			}
		}
		socket.broadcast.to(socket.room).emit('change nickname', id, name)
	})
	socket.on('add puppet', (puppet, name) => {
		let room = rooms[socket.room]
		if (!socket.room || !room) return
		if (logLevel >= 1) console.log("Received puppet from " + socket.id + " with nickname " + name)
		for (let i = 0; i < room.puppets.length; i++) {
			socket.emit('add puppet', room.puppets[i], room.names[i], room.admins.includes(room.puppets[i].socket), room.host === room.puppets[i].socket)
		}
		room.numPuppets++
		puppet.socket = socket.id
		puppet.charId = room.numPuppets
		room.puppets.push(puppet)
		room.names.push(name)
		socket.emit('assign puppet', room.numPuppets, room.host === socket.id)
		socket.broadcast.to(socket.room).emit('add puppet', puppet, name, room.admins.includes(socket.id), room.host === socket.id)
	})
	socket.on('set puppet', (id, puppet) => {
		let room = rooms[socket.room]
		if (!socket.room || !room) return
		if (logLevel >= 2) console.log(socket.id + " changed puppets")
		socket.broadcast.to(socket.room).emit('set puppet', id, puppet)
		for (let i = 0; i < room.puppets.length; i++) {
			if (room.puppets[i].charId == id) {
				puppet.socket = room.puppets[i].socket
				puppet.charId = room.puppets[i].charId
				room.puppets[i] = puppet
				break
			}
		}
	})
	socket.on('set emote', (id, emote) => {
		let room = rooms[socket.room]
		if (!socket.room || !room) return
		if (logLevel >= 3) console.log(socket.id + " changed to emote " + emote)
		socket.broadcast.to(socket.room).emit('set emote', id, emote)
		for (let i = 0; i < room.puppets.length; i++) {
			if (room.puppets[i].charId == id) {
				room.puppets[i].emote = emote
				break
			}
		}
	})
	socket.on('move left', (id) => {
		let room = rooms[socket.room]
		if (!socket.room || !room) return
		if (logLevel >= 3) console.log(socket.id + " moved left")
		socket.broadcast.to(socket.room).emit('move left', id)
		for (let i = 0; i < room.puppets.length; i++) {
			if (room.puppets[i].charId == id) {
				if (room.puppets[i].facingLeft)
					room.puppets[i].target = --room.puppets[i].position
				else
					room.puppets[i].facingLeft = true
				break
			}
		}
	})
	socket.on('move right', (id) => {
		let room = rooms[socket.room]
		if (!socket.room || !room) return
		if (logLevel >= 3) console.log(socket.id + " moved right")
		socket.broadcast.to(socket.room).emit('move right', id)
		for (let i = 0; i < room.puppets.length; i++) {
			if (room.puppets[i].charId == id) {
				if (room.puppets[i].facingLeft)
					room.puppets[i].facingLeft = true
				else
					room.puppets[i].target = ++room.puppets[i].position
				break
			}
		}
	})
	socket.on('start babbling', (id) => {
		let room = rooms[socket.room]
		if (!socket.room || !room) return
		if (logLevel >= 3) console.log(socket.id + " started babbling")
		socket.broadcast.to(socket.room).emit('start babbling', id)
	})
	socket.on('stop babbling', (id) => {
		let room = rooms[socket.room]
		if (!socket.room || !room) return
		if (logLevel >= 3) console.log(socket.id + " stopped babbling")
		socket.broadcast.to(socket.room).emit('stop babbling', id)
	})
	socket.on('jiggle', (id) => {
		let room = rooms[socket.room]
		if (!socket.room || !room) return
		if (logLevel >= 3) console.log(socket.id + " jiggled")
		socket.broadcast.to(socket.room).emit('jiggle', id)
	})
	socket.on('banish', () => {
		let room = rooms[socket.room]
		if (!socket.room || !room || !room.admins.includes(socket.id)) return
		if (logLevel >= 3) console.log(socket.id + " sent all puppets off the stage")
		socket.broadcast.to(socket.room).emit('banish')
        for (let i = 0; i < room.puppets.length; i++) {
            let puppet = room.puppets[i]
            if (puppet.target > room.numCharacters / 2) {
                puppet.position = puppet.target = room.numCharacters + 1
                puppet.facingLeft = false
            } else {
                puppet.position = puppet.target = 0
                puppet.facingLeft = true
            }
        }
	})
	socket.on('kick user', (id) => {
		let room = rooms[socket.room]
		if (!socket.room || !room || !room.admins.includes(socket.id)) return
		if (logLevel >= 1) console.log(socket.id + " kicked " + id)
		// Can't kick the host
		if (room.host === id) return
		// Can't kick an admin if we aren't the host
		if (room.admins.includes(id) && room.host !== socket.id) return
		for (let i = 0; i < room.puppets.length; i++) {
			if (room.puppets[i].charId == id) {
				leaveRoom(server.sockets.sockets[room.puppets[i].socket])
				break
			}
		}
	})
	socket.on('promote user', (id) => {
		let room = rooms[socket.room]
		if (!socket.room || !room || room.host !== socket.id) return
		// Can't demote the host
		if (room.host === id) return
		let index
		for (let i = 0; i < room.puppets.length; i++)
			if (room.puppets[i].charId == id) {
				index = i
				break
			}
		if (room.admins.includes(room.puppets[index].socket)) {
			// Demote
			if (logLevel >= 2) console.log(socket.id + " demoted " + id)
			room.admins.splice(room.admins.indexOf(id), 1)
			server.sockets.in(socket.room).emit('demote', id)
		} else {
			// Promote
			if (logLevel >= 2) console.log(socket.id + " promoted " + id)
			room.admins.push(room.puppets[index].socket)
			server.sockets.in(socket.room).emit('promote', id)
		}
	})
	socket.on('change password', (password) => {
		let room = rooms[socket.room]
		if (!socket.room || !room || room.host !== socket.id) return
		if (logLevel >= 2) console.log(socket.id + " changed the room's password to " + password)
		room.password = password
		socket.broadcast.to(socket.room).emit('change password', password)
	})
	socket.on('set scale', (scale) => {
		let room = rooms[socket.room]
		if (!socket.room || !room || !room.admins.includes(socket.id)) return
		if (logLevel >= 3) console.log(socket.id + " changed the puppetScale to " + scale)
		room.puppetScale = scale
		socket.broadcast.to(socket.room).emit('set scale', scale)
	})
	socket.on('set slots', (slots) => {
		let room = rooms[socket.room]
		if (!socket.room || !room || !room.admins.includes(socket.id)) return
		if (logLevel >= 3) console.log(socket.id + " changed the number of puppet slots to " + slots)
		room.numCharacters = slots
		socket.broadcast.to(socket.room).emit('set slots', slots)
	})
	socket.on('delete asset', (id) => {
		let room = rooms[socket.room]
		if (!socket.room || !room) return
		if (logLevel >= 3) console.log(socket.id + " deleted asset " + id)
		delete room.assets[id]
		socket.broadcast.to(socket.room).emit('delete asset', id)
	})

	socket.on('disconnecting', () => {
		leaveRoom(socket)		
	})
	socket.on('disconnect', () => {
		if (logLevel >= 1) console.log(socket.id + " disconnected.")
	})

	socket.on('add asset', (id, asset) => {
		let room = rooms[socket.room]
		if (!socket.room || !room) return
		if (logLevel >= 3) console.log("Received new asset " + JSON.stringify(asset) + " from " + socket.id)
		if (!room.assets[id] || asset.version > room.assets[id].version) {
			if (logLevel >= 3) console.log("Downloading new asset from " + socket.id)
			var stream = ss.createStream()
			fs.ensureDirSync(path.join(assetsPath, room.host, id.split(':')[0]))
			ss(socket).emit('request asset', stream, id)
			stream.on('end', () => {
				room.assets[id] = asset
				socket.broadcast.to(socket.room).emit('add asset', id, asset)
			})
			stream.pipe(fs.createWriteStream(path.join(assetsPath, room.host, id.split(':')[0], id.split(':')[1] + '.png')))
		}
	})
	ss(socket).on('request asset', function(stream, id) {
		let room = rooms[socket.room]
		if (!socket.room || !room) return
		fs.createReadStream(path.join(assetsPath, room.host, room.assets[id].location)).pipe(stream)
	})
})

if (logLevel >= 1) console.log("Started Server!")

function leaveRoom(socket) {
	let room = rooms[socket.room]
	if (!socket.room || !room) return
	if (logLevel >= 1) console.log(socket.id + " left room:", socket.room)
	if (room.host === socket.id) {
		if (logLevel >= 1) console.log("Closing room:", socket.room)
		server.sockets.in(socket.room).emit('leave room')
		delete rooms[socket.room]
		let sockets = server.sockets.in(socket.room).sockets
		let keys = Object.keys(sockets)
		for (let i = 0; i < keys.length; i++) {
			sockets[keys[i]].leave(socket.room)
			sockets[keys[i]].room = null
		}
		fs.remove(path.join(assetsPath, room.host))
	} else {
		socket.emit('leave room')
		for (let i = 0; i < room.puppets.length; i++) {
			if (room.puppets[i].socket === socket.id) {
				socket.broadcast.to(socket.room).emit('remove puppet', room.puppets[i].charId)
				room.puppets.splice(i, 1)
				break
			}
		}
		socket.room = null
	}
}
