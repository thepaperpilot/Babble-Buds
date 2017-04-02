const fs = require('fs-extra')
const main = require('../main')
const menu = require('./menus/application-menu')
const settings = require('./settings')
const {dialog} = require('electron')

const path = require('path')

var oldProject
var oldAssets

exports.readProject = function(filepath) {
	if (!exports.checkChanges()) return

	fs.readJson(filepath, (err, project) => {
		if (err) {
			main.redirect('welcome.html')
			return
		}

		exports.project = project
		oldProject = JSON.stringify(exports.project)
		exports.characters = {}
		exports.assets = {}
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
		oldAssets = JSON.stringify(exports.assets)

		menu.updateMenu()
		settings.settings.openProject = filepath
		settings.save()

		main.redirect('application.html')
	})
}

exports.saveProject = function() {
	fs.writeJson(settings.settings.openProject, exports.project)
	var tabs = Object.keys(exports.assets)
	for (var i = 0; i < tabs.length; i++)
		fs.writeJson(path.join(settings.settings.openProject, '..', 'assets', tabs[i] + '.json'), exports.assets[tabs[i]])
	oldProject = JSON.stringify(exports.project)
	oldAssets = JSON.stringify(exports.assets)
	// TODO save characters
	// (not doing it right now since the editor isn't made yet)
}

exports.closeProject = function() {
	if (!exports.checkChanges()) return

	exports.project = null
	exports.assets = null
	oldProject = 'null'
	oldAssets = 'null'
	menu.updateMenu()
	settings.settings.openProject = ""
	settings.save()

	main.redirect('welcome.html')
}

// Returns true if its okay to close the project
exports.checkChanges = function() {
	var changes = oldProject !== JSON.stringify(exports.project)
	changes = changes || oldAssets !== JSON.stringify(exports.assets)
	if (changes) {
		var response = dialog.showMessageBox({
			"type": "question",
			"buttons": ["Don't Save", "Cancel", "Save"],
			"defaultId": 2,
			"title": "Save Project?",
			"message": "Do you want to save the changes to your project?",
			"detail": "If you don't save, your changes will be lost.",
			"cancelId": 1
		})

		switch (response) {
			default:
				break
			case 1:
				return false
			case 2:
				exports.saveProject()
				break
		}
	}

	return true
}

// Changing exports arrays doesn't seem to work outside of the file?
exports.updateHotbar = function(i, puppet) {
	exports.project.hotbar[i] = puppet
}

exports.addAsset = function(tab, asset) {
	if (!exports.assets[tab])
		exports.assets[tab] = {}
	exports.assets[tab][asset] = {"location": path.join(tab, asset + '.png')}
}
