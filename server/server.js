// Load requirements
const https = require('https')
const http = require('http')
const path = require('path')

const fs = require('fs-extra')
const ss = require('socket.io-stream')
const express = require('express')

// Load environment variables
require('dotenv').config()

// Settings
const port = process.env.NODE_ENV === 'production' ?
    process.env.SECURE_PORT || 8443 :
    process.env.PORT || 8080
const assetsPath = path.join(__dirname, 'build', 'temp-assets')
const clientVersion = "~0.9.99"
const logLevels = ['log', 'warn', 'error'] // Possible values: 'info', 'log', 'warn', 'error'

// Set up server
const app = express()
const credentials = {
    key: fs.readFileSync(process.env.KEY_PATH || 'certs/server.key'),
    cert: fs.readFileSync(process.env.CERT_PATH || 'certs/server.crt')
}

app.use(express.static('build'))

app.get('*', function(req, res) {  
    res.sendFile(path.join(__dirname, './src/index.html'))
})

// Set up http server redirecting to the https one
if (process.env.NODE_ENV === 'production') {
    http.createServer(function (req, res) {
        if (req.headers.host.startsWith('localhost:') || req.headers.host.startsWith('127.0.0.1:'))
            res.writeHead(301, { Location: `https://localhost:${process.env.SECURE_PORT || 8443}${req.url}` })
        else
            res.writeHead(301, { Location: `https://${req.headers['host']}${req.url}` })
        res.end()
    }).listen(process.env.PORT || 8080);
}

// Set up socket io
const server = (process.env.NODE_ENV === 'production' ? https : http).createServer(credentials, app)
const io = require('socket.io')(server)

const rooms = {}
const connections = {}
const statusLog = []

function emitAdmin(...message) {
    io.sockets.in('admin').emit(...message)
}

function log(message, level = 'log', room = null, data = null) {
    statusLog.push({ message, level, room, data })
    if (logLevels.includes(level))
        console[level](message)
    emitAdmin('log', { message, level, room, data })
}

io.on('connection', function(socket) {
    log(`New Connection: ${socket.id}`)
    connections[socket.id] = ''
    emitAdmin('add connection', socket.id)

    // Send server version, to ensure client version is compatible
    socket.emit('serverVersion', clientVersion)

    socket.on('login', (username, password) => {
        if (
            username === process.env.ADMIN_USERNAME &&
            password === process.env.ADMIN_PASSWORD
        ) {
            socket.emit('loginSuccess', { rooms, statusLog, connections })
            socket.join('admin')
            log(`${socket.id} logged into admin console`)
            emitAdmin('update connection', socket.id, 'admin')
        } else {
            socket.emit('loginFailed')
            log(`${socket.id} failed to log into admin console`)
        }
    })
    socket.on('close room', id => {
        leaveRoom(io.sockets.sockets[rooms[id].host])
    })

    // Add Application Listeners
    socket.on('connect to room', (name, password, nickname, environment) => {
        if (name === 'admin' || name === '') {
            socket.emit('info', 'Cannot join that room')
            return
        }

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

            log(`${nickname} (${socket.id}) joined room: ${name}`, 'log', name)
            emitAdmin('update room', name, { users: room.users })
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
                assetPaths: {},
                numPuppets: 0
            }
            log(`${nickname} (${socket.id}) created room: ${name}`, 'log', name)
            emitAdmin('add room', name, rooms[name])
        }
        connections[socket.id] = name
        emitAdmin('update connection', socket.id, name)
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
        log(`${room.users[socket.id].nickname} (${socket.id}) transferred ownership of ${socket.room} to ${room.users[id].nickname} (${id})`, 'log', socket.room)
        room.host = id
        if (!room.admins.includes(id))
            room.admins.push(id)
        io.sockets.in(socket.room).emit('set host', id)
        emitAdmin('update room', socket.room, { host: id })
    })
    socket.on('change nickname', (nickname) => {
        let room = rooms[socket.room]
        if (!socket.room || !room) return
        log(`${room.users[socket.id].nickname} (${socket.id}) changed their nickname to ${nickname}`, 'info', socket.room)
        room.users[socket.id].nickname = nickname
        io.sockets.in(socket.room).emit('change nickname', socket.id, nickname)
        emitAdmin('update room', socket.room, { users: room.users })
    })
    socket.on('add actor', (actor) => {
        let room = rooms[socket.room]
        if (!socket.room || !room) return
        log(`Received actor from ${room.users[socket.id].nickname} (${socket.id})`, 'info', socket.room, actor)
        actor.socket = socket.id
        const newId = `server-${room.numPuppets++}`
        socket.emit('assign actor', actor.id, newId)
        actor.id = newId
        room.puppets[actor.id] = actor
        room.users[socket.id].actors.push(actor.id)
        socket.broadcast.to(socket.room).emit('add actor', socket.id, actor.id, actor)
        emitAdmin('update room', socket.room, { users: room.users })
        emitAdmin('update puppet', socket.room, actor.id, actor)
    })
    socket.on('set puppet', (id, puppet) => {
        let room = rooms[socket.room]
        if (!socket.room || !room) return
        log(`${room.users[socket.id].nickname} (${socket.id}) changed puppets`, 'info', socket.room, puppet)
        socket.broadcast.to(socket.room).emit('set puppet', id, puppet)
        puppet.socket = socket.id
        puppet.puppetId = id
        room.puppets[id].character = puppet
        emitAdmin('update puppet', socket.room, id, { character: puppet })
    })
    socket.on('set emote', (id, emote) => {
        let room = rooms[socket.room]
        if (!socket.room || !room) return
        log(`${room.users[socket.id].nickname} (${socket.id}) changed to emote ${emote}`, 'info', socket.room)
        socket.broadcast.to(socket.room).emit('set emote', id, emote)
        room.puppets[id].emote = emote
        emitAdmin('update puppet', socket.room, id, { emote })
    })
    socket.on('move puppet', (id, position, facingLeft) => {
        let room = rooms[socket.room]
        if (!socket.room || !room) return
        log(`${room.users[socket.id].nickname} (${socket.id}) moved their puppet to ${position}, facing ${facingLeft ? 'left' : 'right'}`, 'info', socket.room)
        socket.broadcast.to(socket.room).emit('move puppet', id, position, facingLeft)
        room.puppets[id].position = position
        room.puppets[id].facingLeft = facingLeft
        emitAdmin('update puppet', socket.room, id, { position, facingLeft })
    })
    socket.on('start babbling', (id) => {
        let room = rooms[socket.room]
        if (!socket.room || !room) return
        log(`${room.users[socket.id].nickname} (${socket.id}) started babbling`, 'info', socket.room)
        socket.broadcast.to(socket.room).emit('start babbling', id)
    })
    socket.on('stop babbling', (id) => {
        let room = rooms[socket.room]
        if (!socket.room || !room) return
        log(`${room.users[socket.id].nickname} (${socket.id}) stopped babbling`, 'info', socket.room)
        socket.broadcast.to(socket.room).emit('stop babbling', id)
    })
    socket.on('jiggle', (id) => {
        let room = rooms[socket.room]
        if (!socket.room || !room) return
        log(`${room.users[socket.id].nickname} (${socket.id}) jiggled`, 'info')
        socket.broadcast.to(socket.room).emit('jiggle', id)
    })
    socket.on('banish', () => {
        let room = rooms[socket.room]
        if (!socket.room || !room || !room.admins.includes(socket.id)) return
        log(`${room.users[socket.id].nickname} (${socket.id}) sent all puppets off the stage`, 'info', socket.room)
        socket.broadcast.to(socket.room).emit('banish')
        Object.values(room.puppets).forEach(puppet => {
            if (puppet.position > room.numCharacters / 2) {
                puppet.position = room.numCharacters + 1
                puppet.facingLeft = false
            } else {
                puppet.position = 0
                puppet.facingLeft = true
            }
            emitAdmin('update puppet', socket.room, puppet.id, { position: puppet.position, facingLeft: puppet.facingLeft })
        })
    })
    socket.on('kick user', (id) => {
        let room = rooms[socket.room]
        if (!socket.room || !room || !room.admins.includes(socket.id)) return
        log(`${room.users[socket.id].nickname} (${socket.id}) kicked ${room.users[id].nickname} (${id})`, socket.room)
        // Can't kick the host
        if (room.host === id) return
        // Can't kick an admin if we aren't the host
        if (room.admins.includes(id) && room.host !== socket.id) return
        leaveRoom(io.sockets.sockets[id])
    })
    socket.on('promote user', (id) => {
        let room = rooms[socket.room]
        if (!socket.room || !room || room.host !== socket.id) return
        // Can't demote the host
        if (room.host === id) return
        if (room.admins.includes(id)) {
            // Demote
            log(`${room.users[socket.id].nickname} (${socket.id}) demoted ${room.users[id].nickname} (${id})`, socket.room)
            room.admins.splice(room.admins.indexOf(id), 1)
            io.sockets.in(socket.room).emit('demote', id)
        } else {
            // Promote
            log(`${room.users[socket.id].nickname} (${socket.id}) promoted ${room.users[id].nickname} (${id})`, socket.room)
            room.admins.push(id)
            io.sockets.in(socket.room).emit('promote', id)
        }
        emitAdmin('update room', socket.room, { admins: room.admins })
    })
    socket.on('change password', (password) => {
        let room = rooms[socket.room]
        if (!socket.room || !room || room.host !== socket.id) return
        log(`${room.users[socket.id].nickname} (${socket.id}) changed the room's password`, 'info', socket.room)
        room.password = password
        socket.broadcast.to(socket.room).emit('change password', password)
        emitAdmin('update room', socket.room, { password })
    })
    socket.on('set environment', (environment) => {
        let room = rooms[socket.room]
        if (!socket.room || !room || !room.admins.includes(socket.id)) return
        log(`${room.users[socket.id].nickname} (${socket.id}) changed the room's environment`, 'info', socket.room, environment)
        room.envSetter = socket.id
        room.environment = environment
        socket.broadcast.to(socket.room).emit('set environment', socket.id, environment.id, environment)
        emitAdmin('update room', socket.room, { envSetter: socket.id, environment })
    })
    socket.on('delete asset', (id) => {
        let room = rooms[socket.room]
        if (!socket.room || !room) return
        log(`${room.users[socket.id].nickname} (${socket.id}) deleted asset ${id}`, 'info', socket.room, room.assets[id])
        delete room.assets[id]
        delete room.assetPaths[id]
        socket.broadcast.to(socket.room).emit('delete asset', id)
        emitAdmin('update room', socket.room, { assets: room.assets, assetPaths: room.assetPaths })
    })

    socket.on('disconnecting', () => {
        leaveRoom(socket)       
    })
    socket.on('disconnect', () => {
        log(socket.id + " disconnected.")
        delete connections[socket.id]
        emitAdmin('remove connection', socket.id)
    })

    socket.on('add asset', (id, asset) => {
        let room = rooms[socket.room]
        if (!socket.room || !room) return
        if (!room.assets[id] || asset.version > room.assets[id].version) {
            var stream = ss.createStream()
            fs.ensureDirSync(path.join(assetsPath, room.host, id.split(':')[0]))
            const location = path.join(assetsPath, room.host, id.split(':')[0], id.split(':')[1] + '.png')
            ss(socket).emit('request asset', stream, id)
            stream.on('end', () => {
                room.assets[id] = asset
                room.assetPaths[id] = path.relative(path.join(__dirname, 'build'), location)
                socket.broadcast.to(socket.room).emit('add asset', id, asset)
                emitAdmin('update room', socket.room, { assets: room.assets, assetPaths: room.assetPaths })
                log(`${room.users[socket.id].nickname} (${socket.id}) added asset ${id}`, 'info', socket.room, {
                    ...asset,
                    location: path.relative(path.join(__dirname, 'build'), location)
                })
            })
            stream.pipe(fs.createWriteStream(location))
        }
    })
    ss(socket).on('request asset', function(stream, id) {
        let room = rooms[socket.room]
        if (!socket.room || !room) return
        fs.createReadStream(path.join(assetsPath, room.host, room.assets[id].location)).pipe(stream)
    })
})

function leaveRoom(socket) {
    let room = rooms[socket.room]
    if (!socket.room || !room) return
    log(`${room.users[socket.id].nickname} (${socket.id}) left room: ${socket.room}`, 'log', socket.room)
    if (room.host === socket.id) {
        log(`Closing room: ${socket.room}`, 'log', socket.room)
        io.sockets.in(socket.room).emit('leave room')
        delete rooms[socket.room]
        emitAdmin('remove room', socket.room)
        Object.values(io.sockets.in(socket.room).sockets).forEach(s => {
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
        socket.leave(socket.room)
        emitAdmin('update room', socket.room, { puppets: room.puppets, users: room.users })
        socket.room = null
    }
    connections[socket.id] = ''
    emitAdmin('update connection', socket.id, '')
}

// Start server
server.listen(port, () => console.log(`Listening on port ${port}`))
