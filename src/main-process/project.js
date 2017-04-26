const fs = require('fs-extra')
const main = require('../main')
const menu = require('./menus/application-menu')
const settings = require('./settings')
const {dialog} = require('electron')

const path = require('path')

var oldProject
var oldAssets
var oldCharacters

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
		exports.numCharacters = 0
		for (var i = 0; i < project.characters.length; i++) {
			exports.characters[project.characters[i].id] = fs.readJsonSync(path.join(exports.charactersPath, project.characters[i].location))
			exports.characters[project.characters[i].id].name = project.characters[i].name
			exports.characters[project.characters[i].id].id = project.characters[i].id
			if (project.characters[i].id > exports.numCharacters)
				exports.numCharacters = project.characters[i].id
		}
		oldCharacters = JSON.stringify(exports.characters)
		exports.actor = project.actor
		exports.actor.position = project.actor.position
		exports.actor.facingLeft = project.actor.facingLeft
		exports.actor.emote = project.actor.emote
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
	for (var i = 0; i < exports.project.assets.length; i++)
		fs.writeJson(path.join(settings.settings.openProject, '..', 'assets', exports.project.assets[i].location), exports.assets[exports.project.assets[i].name])
	for (var i = 0; i < exports.project.characters.length; i++)
		fs.writeJson(path.join(settings.settings.openProject, '..', 'characters', exports.project.characters[i].location), exports.characters[exports.project.characters[i].id])
	oldProject = JSON.stringify(exports.project)
	oldAssets = JSON.stringify(exports.assets)
	oldCharacters = JSON.stringify(exports.characters)
}

exports.closeProject = function() {
	if (!exports.checkChanges()) return

	exports.project = null
	exports.assets = null
	exports.characters = null
	oldProject = 'null'
	oldAssets = 'null'
	oldCharacters = 'null'
	menu.updateMenu()
	settings.settings.openProject = ""
	settings.save()

	main.redirect('welcome.html')
}

// Returns true if its okay to close the project
exports.checkChanges = function() {
	var changes = oldProject !== JSON.stringify(exports.project)
	changes = changes || oldAssets !== JSON.stringify(exports.assets)
	changes = changes || oldCharacters !== JSON.stringify(exports.characters)
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

exports.updateHotbar = function(i, id) {
	exports.project.hotbar[i] = id
}

exports.addAsset = function(asset) {
	if (!exports.assets[asset.tab]) {
		exports.assets[asset.tab] = {}
		exports.project.assets.push({"name": tab, "location": tab.toLowerCase() + '.json'})
	}
	exports.assets[asset.tab][asset.hash] = {"name": asset.name, "location": path.join(asset.tab, asset.hash + '.png')}
}

exports.moveAsset = function(tab, asset, newTab) {
	exports.assets[newTab][asset] = {"name": exports.assets[tab][asset].name, "location": path.join(newTab, asset + '.png')}
	delete exports.assets[tab][asset]
}

exports.saveAsset = function(tab, hash, asset) {
	exports.assets[tab][hash] = asset
}

exports.saveCharacter = function(character) {
	var exists = false
	for (var i = 0; i < exports.project.characters.length; i++) {
		if (exports.project.characters[i].id == character.id) {
			exists = true
			break
		}
	}
	if (!exists)
		exports.project.characters.push({"name": character.name, "id": character.id, "location": character.name.toLowerCase() + '_' + character.id + '.json'})
	exports.characters[character.id] = character
}

exports.getEmptyCharacter = function() {
	exports.numCharacters++
	return JSON.stringify({
	    "deadbonesStyle": false,
	    "body": [],
	    "head": [],
	    "hat": [],
	    "mouths": [],
	    "eyes": [],
	    "emotes": {
	    	"default": {
	    		"enabled": true,
		        "mouth": [],
		        "eyes": []
		    }
	    },
	    "props": [],
	    "name": "New Puppet",
	    "id": exports.numCharacters
	})
}

exports.duplicateCharacter = function(character) {
	exports.numCharacters++
	character.id = exports.numCharacters
	return JSON.stringify(character)
}

exports.deleteCharacter = function(character) {
	for (var i = 0; i < exports.project.characters.length; i++) {
		if (exports.project.characters[i].id == character.id) {
			exports.project.characters.splice(i, 1)
			delete exports.characters[character.id]
			if (character.id == exports.numCharacters) exports.numCharacters--
			break
		}
	}
}

exports.getPuppet = function() {
	var puppet = JSON.parse(JSON.stringify(exports.characters[exports.actor.id]))
	puppet.position = exports.actor.position
	puppet.emote = exports.actor.emote
	puppet.facingLeft = exports.actor.facingLeft
	return puppet
}
