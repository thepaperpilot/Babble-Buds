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
var clientVersion = "~0.9.99"	// Clients will need to match this version/range

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
    socket.on('connect to room', (name, password, nickname, environment) => {
        if (socket.room) {
            socket.emit('info', 'Already in a room')
            return
        }

        let isHost

        if (rooms[name]) {
            isHost = false
            // Joining Room
            if (rooms[name].password !== password) {
                socket.emit('info', 'Couldn\'t join room: Wrong password!.')
                return
            }

            // Send room settings
            let room = rooms[name]
            socket.emit('set environment', room.envSetter, room.environment.id, room.environment)
            socket.emit('add assets', room.assets)
            Object.keys(room.users).forEach(id => {
                const user = room.users[id]
                const actors = user.actors.reduce((acc, curr) => {
                    acc[curr] = room.puppets[curr]
                    return acc
                }, {})
                socket.emit('add user', id, actors, user.nickname, room.admins.includes(id), room.host === id)
            })

            // Add user to room
            socket.join(name)
            socket.room = name
            room.users[socket.id] = {
                nickname,
                actors: []
            }
            socket.broadcast.to(socket.room).emit('add user', socket.id, [], nickname, false, false)

            if (logLevel >= 1) console.log(`${nickname} (${socket.id}) joined room: ${name}`)
        } else {
            isHost = true
            // Creating Room
            socket.join(name)
            socket.room = name
            rooms[name] = {
                host: socket.id,
                admins: [socket.id],
                password: password,
                envSetter: socket.id,
                environment,
                puppets: {},
                users: {
                    [socket.id]: {
                        nickname,
                        actors: []
                    }
                },
                assets: {},
                numPuppets: 0
            }
            if (logLevel >= 1) console.log(`${nickname} (${socket.id}) created room: ${name}`)
        }
        socket.emit('joined room', name, socket.id, isHost)
    })
	socket.on('leave room', () => {
		leaveRoom(socket)
	})
    socket.on('change host', (id) => {
        let room = rooms[socket.room]
        if (!socket.room || !room) return
        if (!(id in room.users)) return
        if (room.host !== socket.id) return
        if (logLevel >= 1) console.log(`${room.users[socket.id].nickname} (${socket.id}) transferred ownership of ${socket.room} to ${room.users[id].nickname} (${id})`)
        room.host = id
        if (!room.admins.includes(id))
            room.admins.push(id)
        server.sockets.in(socket.room).emit('set host', id)
    })
	socket.on('change nickname', (nickname) => {
		let room = rooms[socket.room]
		if (!socket.room || !room) return
		if (logLevel >= 2) console.log(`${room.users[id].nickname} (${socket.id}) changed their nickname to ${nickname}`)
        room.users[socket.id].nickname = nickname
		socket.broadcast.to(socket.room).emit('change nickname', socket.id, nickname)
	})
	socket.on('add actor', (actor) => {
		let room = rooms[socket.room]
		if (!socket.room || !room) return
		if (logLevel >= 1) console.log(`Received actor from ${room.users[socket.id].nickname} (${socket.id})`)
		actor.socket = socket.id
        const newId = `server-${room.numPuppets++}`
		socket.emit('assign actor', actor.id, newId)
		actor.id = newId
		room.puppets[actor.id] = actor
        room.users[socket.id].actors.push(actor.id)
		socket.broadcast.to(socket.room).emit('add actor', socket.id, actor.id, actor)
	})
	socket.on('set puppet', (id, puppet) => {
		let room = rooms[socket.room]
		if (!socket.room || !room) return
		if (logLevel >= 2) console.log(`${room.users[socket.id].nickname} (${socket.id}) changed puppets`)
		socket.broadcast.to(socket.room).emit('set puppet', id, puppet)
        puppet.socket = socket.id
        puppet.puppetId = id
        room.puppets[id] = puppet
	})
	socket.on('set emote', (id, emote) => {
		let room = rooms[socket.room]
		if (!socket.room || !room) return
		if (logLevel >= 3) console.log(`${room.users[socket.id].nickname} (${socket.id}) changed to emote ${emote}`)
		socket.broadcast.to(socket.room).emit('set emote', id, emote)
        room.puppets[id].emote = emote
	})
	socket.on('move left', (id) => {
		let room = rooms[socket.room]
		if (!socket.room || !room) return
		if (logLevel >= 3) console.log(`${room.users[socket.id].nickname} (${socket.id}) moved left`)
		socket.broadcast.to(socket.room).emit('move left', id)
		if (room.puppets[id].facingLeft)
			room.puppets[id].position--
		else
			room.puppets[id].facingLeft = true
	})
	socket.on('move right', (id) => {
		let room = rooms[socket.room]
		if (!socket.room || !room) return
		if (logLevel >= 3) console.log(`${room.users[socket.id].nickname} (${socket.id}) moved right`)
		socket.broadcast.to(socket.room).emit('move right', id)
		if (room.puppets[id].facingLeft)
			room.puppets[id].facingLeft = true
		else
			room.puppets[id].position++
	})
	socket.on('start babbling', (id) => {
		let room = rooms[socket.room]
		if (!socket.room || !room) return
		if (logLevel >= 3) console.log(`${room.users[socket.id].nickname} (${socket.id}) started babbling`)
		socket.broadcast.to(socket.room).emit('start babbling', id)
	})
	socket.on('stop babbling', (id) => {
		let room = rooms[socket.room]
		if (!socket.room || !room) return
		if (logLevel >= 3) console.log(`${room.users[socket.id].nickname} (${socket.id}) stopped babbling`)
		socket.broadcast.to(socket.room).emit('stop babbling', id)
	})
	socket.on('jiggle', (id) => {
		let room = rooms[socket.room]
		if (!socket.room || !room) return
		if (logLevel >= 3) console.log(`${room.users[socket.id].nickname} (${socket.id}) jiggled`)
		socket.broadcast.to(socket.room).emit('jiggle', id)
	})
	socket.on('banish', () => {
		let room = rooms[socket.room]
		if (!socket.room || !room || !room.admins.includes(socket.id)) return
		if (logLevel >= 3) console.log(`${room.users[socket.id].nickname} (${socket.id}) sent all puppets off the stage`)
		socket.broadcast.to(socket.room).emit('banish')
        Object.values(room.puppets).forEach(puppet => {
            if (puppet.position > room.numCharacters / 2) {
                puppet.position = room.numCharacters + 1
                puppet.facingLeft = false
            } else {
                puppet.position = 0
                puppet.facingLeft = true
            }
        })
	})
	socket.on('kick user', (id) => {
		let room = rooms[socket.room]
		if (!socket.room || !room || !room.admins.includes(socket.id)) return
		if (logLevel >= 1) console.log(`${room.users[socket.id].nickname} (${socket.id}) kicked ${room.users[id].nickname} (${id})`)
		// Can't kick the host
		if (room.host === id) return
		// Can't kick an admin if we aren't the host
		if (room.admins.includes(id) && room.host !== socket.id) return
        leaveRoom(server.sockets.sockets[id])
	})
	socket.on('promote user', (id) => {
		let room = rooms[socket.room]
		if (!socket.room || !room || room.host !== socket.id) return
		// Can't demote the host
		if (room.host === id) return
		if (room.admins.includes(id)) {
			// Demote
			if (logLevel >= 2) console.log(`${room.users[socket.id].nickname} (${socket.id}) demoted ${room.users[id].nickname} (${id})`)
			room.admins.splice(room.admins.indexOf(id), 1)
			server.sockets.in(socket.room).emit('demote', id)
		} else {
			// Promote
			if (logLevel >= 2) console.log(`${room.users[socket.id].nickname} (${socket.id}) promoted ${room.users[id].nickname} (${id})`)
			room.admins.push(id)
			server.sockets.in(socket.room).emit('promote', id)
		}
	})
	socket.on('change password', (password) => {
		let room = rooms[socket.room]
		if (!socket.room || !room || room.host !== socket.id) return
		if (logLevel >= 2) console.log(`${room.users[socket.id].nickname} (${socket.id}) changed the room's password to ${password}`)
		room.password = password
		socket.broadcast.to(socket.room).emit('change password', password)
	})
	socket.on('set environment', (environment) => {
		let room = rooms[socket.room]
		if (!socket.room || !room || !room.admins.includes(socket.id)) return
		if (logLevel >= 3) console.log(`${room.users[socket.id].nickname} (${socket.id}) changed the room's environment`)
        room.envSetter = socket.id
		room.environment = environment
		socket.broadcast.to(socket.room).emit('set environment', socket.id, environment.id, environment)
	})
	socket.on('delete asset', (id) => {
		let room = rooms[socket.room]
		if (!socket.room || !room) return
		if (logLevel >= 3) console.log(`${room.users[socket.id].nickname} (${socket.id}) deleted asset ${id}`)
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
		if (logLevel >= 3) console.log(`${room.users[socket.id].nickname} (${socket.id}) added asset ${id}`)
		if (!room.assets[id] || asset.version > room.assets[id].version) {
			if (logLevel >= 3) console.log(`Downloading new asset from ${room.users[socket.id].nickname} (${socket.id})`)
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
	if (logLevel >= 1) console.log(`${room.users[socket.id].nickname} (${socket.id}) left room: ${socket.room}`)
	if (room.host === socket.id) {
		if (logLevel >= 1) console.log("Closing room:", socket.room)
		server.sockets.in(socket.room).emit('leave room')
		delete rooms[socket.room]
		Object.values(server.sockets.in(socket.room).sockets).forEach(s => {
            s.leave(socket.room)
            s.room = null
        })
		fs.remove(path.join(assetsPath, room.host))
	} else {
		socket.emit('leave room')
        socket.broadcast.to(socket.room).emit('remove user', socket.id)
        room.users[socket.id].actors.forEach(actor => {
            delete room.puppets[actor]
        })
        delete room.users[socket.id]
        socket.room = null
	}
}
