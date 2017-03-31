// Constants
var port = 8080
var numCharacters = 5

// Variables
var server
var puppets = []
var numPuppets = 1

// Load requirements
var http = require('http')
var io = require('socket.io')

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
	// Add Application Listeners
	socket.on('add puppet', (puppet) => {
		socket.emit('set slots', numCharacters)
		puppet.socket = socket.id
		numPuppets++
		puppet.id = numPuppets
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
			if (puppets[i].id == id) {
				puppet.socket = puppets[i].socket
				puppet.id = puppets[i].id
				puppets[i] = puppet
				break
			}
		}
	})
	socket.on('set emote', (id, emote) => {
		socket.broadcast.emit('set emote', id, emote)
		for (var i = 0; i < puppets.length; i++) {
			if (puppets[i].id == id) {
				puppets[i].emote = emote
				break
			}
		}
	})
	socket.on('move left', (id) => {
		socket.broadcast.emit('move left', id)
		for (var i = 0; i < puppets.length; i++) {
			if (puppets[i].id == id) {
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
			if (puppets[i].id == id) {
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
				server.emit('remove puppet', puppets[i].id)
				puppets.splice(i, 1)
				break
			}
		}
	})
})
