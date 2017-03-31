const fs = require('fs-extra')
const main = require('../main')
const menu = require('./menus/application-menu')
const settings = require('./settings')

const path = require('path')

exports.readProject = function(filepath) {
	fs.readJson(filepath, (err, project) => {
		if (err) {
			main.redirect('welcome.html')
			return
		}

		exports.project = project
		exports.characters = {}
		exports.assets = {}
		exports.hotbar = project.hotbar
		exports.charactersPath = path.join(filepath, '..', 'characters')
		exports.assetsPath = path.join(filepath, '..', 'assets')
		for (var i = 0; i < project.characters.length; i++) {
			exports.characters[project.characters[i].name] = fs.readJsonSync(path.join(exports.charactersPath, project.characters[i].location))
			exports.characters[project.characters[i].name].name = project.characters[i].name
		}
		exports.puppet = project.puppet
		exports.puppet.position = project.puppet.position
		exports.puppet.facingLeft = project.puppet.facingLeft
		exports.puppet.emote = project.puppet.emote
		for (var i = 0; i < project.assets.length; i++) {
			exports.assets[project.assets[i].name] = fs.readJsonSync(path.join(exports.assetsPath, project.assets[i].location))
		}

		menu.updateMenu()
		settings.settings.openProject = filepath
		settings.save()

		main.redirect('application.html')
	})
}

exports.closeProject = function() {
	exports.project = null
	menu.updateMenu()
	settings.settings.openProject = ""
	settings.save()

	main.redirect('welcome.html')
}
