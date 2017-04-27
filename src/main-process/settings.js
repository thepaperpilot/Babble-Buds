const {app} = require('electron')
const main = require('./../main')
const fs = require('fs-extra')

const path = require('path')

const filepath = path.join(app.getPath('userData'), 'settings.json')

module.exports = exports = {
	settings: {
		openProject: ""
	},
	save: function() {
		fs.writeJson(filepath, this.settings)
	},
	load: function() {
		if (fs.existsSync(filepath)) {
			fs.readJson(filepath, (err, obj) => {
				if (err) {
					console.error(err) 
					return;
				}
				
				this.settings = obj
				if (this.settings.openProject) {
			        global.project.filepath = this.settings.openProject
			        main.redirect('application.html')
				}
			})
		}
	}
}
