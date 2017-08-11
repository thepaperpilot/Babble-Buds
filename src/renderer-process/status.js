let status
let lock
let counts

exports.init = function() {
	status = document.getElementById('status')
	status.addEventListener('click', () => {
		require('electron').remote.webContents.getFocusedWebContents().toggleDevTools()
	})
	lock = false
	counts = {}
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
