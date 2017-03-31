const {app} = require('electron')
const fs = require('fs-extra')
const project = require('./project')

const path = require('path')

const filepath = path.join(app.getPath('userData'), 'settings.json')

exports.settings = {	
	"openProject": ""
}

exports.save = function() {
	fs.writeJson(filepath, exports.settings)
}

exports.load = function() {
	if (fs.existsSync(filepath)) {
		fs.readJson(filepath, (err, obj) => {
			if (err) {
				console.error(err) 
				return;
			}
			
			exports.settings = obj
			if (exports.settings.openProject)
				project.readProject(exports.settings.openProject)
		})
	}
}
