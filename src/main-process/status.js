// Imports
const {webContents} = require('electron')

// Vars
var status
var current = ''

exports.init = function() {
	status = document.getElementById('status')
	status.addEventListener('click', () => {
		webContents.getFocusedWebContents().toggleDevTools()
	})
}

exports.log = function(string) {
	status.innerText = string
	console.log(string)
}
