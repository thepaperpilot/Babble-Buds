let status
let lock
let counts

exports.init = function() {
	let remote = require('electron').remote
	status = document.getElementById('status')
	status.addEventListener('click', () => {
		remote.webContents.getFocusedWebContents().toggleDevTools()
	})
	lock = false
	counts = {}
	exports.info("Babble Buds version: " + remote.app.getVersion())
	exports.info("Other Versions: " + JSON.stringify(process.versions, null, 2))
}

exports.info = function(string) {
	console.log(string)
}

exports.log = function(string, setLock) {
	if (setLock !== null) {
		lock = setLock
	} else if (lock) return
	status.innerText = string
	console.log(string)
}

exports.error = function(string, error) {
	status.innerText = string
	console.error(error)
}

exports.increment = function(string) {
	if (!counts[string]) counts[string] = 0
	counts[string]++
	exports.log(string.replace('%x', counts[string]).replace('%s', counts[string] === 1 ? '' : 's'))
	return counts[string] === 0
}

exports.decrement = function(string) {
	if (!counts[string]) counts[string] = 0
	counts[string]--
	exports.log(string.replace('%x', counts[string]).replace('%s', counts[string] === 1 ? '' : 's'))
	return counts[string] === 0
}

exports.getCount = function(string) {
	return counts[string]
}
