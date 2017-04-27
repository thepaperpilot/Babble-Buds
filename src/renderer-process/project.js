const fs = require('fs-extra')
const remote = require('electron').remote
const dialog = remote.dialog
const main = remote.require('./main')
const settings = remote.require('./main-process/settings')
const controller = require('./controller')

const path = require('path')

module.exports = exports = remote.getGlobal('project').project = {
    // project: {},
    // characters: {},
    // assets: {},
    // charactersPath: "",
    // assetsPath: "",
    // numCharacters: 0,
    // actor: {},
	readProject: function() {
		if (!this.checkChanges()) return

        var filepath = remote.getGlobal('project').filepath
		fs.readJson(filepath, (err, proj) => {
			if (err) {
				main.redirect('welcome.html')
				return
			}

			this.project = proj
			this.oldProject = JSON.stringify(proj)
			this.characters = {}
			this.assets = {}
			this.charactersPath = path.join(filepath, '..', 'characters')
			this.assetsPath = path.join(filepath, '..', 'assets')
			this.numCharacters = 0
			for (var i = 0; i < proj.characters.length; i++) {
				this.characters[proj.characters[i].id] = fs.readJsonSync(path.join(this.charactersPath, proj.characters[i].location))
				this.characters[proj.characters[i].id].name = proj.characters[i].name
				this.characters[proj.characters[i].id].id = proj.characters[i].id
				if (proj.characters[i].id > this.numCharacters)
					this.numCharacters = proj.characters[i].id
			}
			this.oldCharacters = JSON.stringify(this.characters)
			this.actor = proj.actor
			this.actor.position = proj.actor.position
			this.actor.facingLeft = proj.actor.facingLeft
			this.actor.emote = proj.actor.emote
			for (var i = 0; i < proj.assets.length; i++) {
				this.assets[proj.assets[i].name] = fs.readJsonSync(path.join(this.assetsPath, proj.assets[i].location))
			}
			this.oldAssets = JSON.stringify(this.assets)

			settings.settings.openProject = filepath
			settings.save()
            controller.init()
		})
	},
	saveProject: function() {
		fs.writeJson(settings.settings.openProject, this.project)
		for (var i = 0; i < this.project.assets.length; i++)
			fs.writeJson(path.join(settings.settings.openProject, '..', 'assets', this.project.assets[i].location), this.assets[this.project.assets[i].name])
		for (var i = 0; i < this.project.characters.length; i++)
			fs.writeJson(path.join(settings.settings.openProject, '..', 'characters', this.project.characters[i].location), this.characters[this.project.characters[i].id])
		this.oldProject = JSON.stringify(this.project)
		this.oldAssets = JSON.stringify(this.assets)
		this.oldCharacters = JSON.stringify(this.characters)
	},
	closeProject: function() {
		if (!this.checkChanges()) return

		this.project = null
		this.assets = null
		this.characters = null
		this.oldProject = 'null'
		this.oldAssets = 'null'
		this.oldCharacters = 'null'
		settings.settings.openProject = ""
		settings.save()

		main.redirect('welcome.html')
	},
	// Returns true if its okay to close the project
	checkChanges: function() {
		var changes = this.oldProject !== JSON.stringify(this.project)
		changes = changes || this.oldAssets !== JSON.stringify(this.assets)
		changes = changes || this.oldCharacters !== JSON.stringify(this.characters)
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
					this.saveProject()
					break
			}
		}

		return true
	},
	// asset = {
	//	 tab: string,
	//	 hash: string,
	//	 name: string
	// }
	addAsset: function(asset) {
		if (!this.assets[asset.tab]) {
			this.assets[asset.tab] = {}
			this.project.assets.push({"name": asset.tab, "location": asset.tab.toLowerCase() + '.json'})
		}
		this.assets[asset.tab][asset.hash] = {"name": asset.name, "location": path.join(asset.tab, asset.hash + '.png')}
	},
	moveAsset: function(tab, asset, newTab) {
		this.assets[newTab][asset] = this.assets[tab][asset]
		this.assets[newTab][asset].location = path.join(newTab, asset + '.png')
		delete this.assets[tab][asset]
	},
	renameAsset: function(tab, hash, name) {
		this.assets[tab][hash].name = name
	},
    deleteAsset: function(tab, asset) {
        delete this.assets[tab][asset]
    },
    saveCharacter: function(character) {
        var exists = false
        for (var i = 0; i < this.project.characters.length; i++) {
            if (this.project.characters[i].id == character.id) {
                exists = true
                break
            }
        }
        if (!exists)
            this.project.characters.push({"name": character.name, "id": character.id, "location": character.name.toLowerCase() + '_' + character.id + '.json'})
        this.characters[character.id] = character
    },
    duplicateCharacter: function(character) {
        this.numCharacters++
        character.id = this.numCharacters
        return JSON.stringify(character)
    },
    deleteCharAssets: function(charId, tab, asset) {
        var character = this.characters[charId]
        var topLevel = ["body", "head", "hat", "props"]
        for (var j = 0; j < topLevel.length; j++)
            for (var k = 0; k < character[topLevel[j]].length; k++)
                if (character[topLevel[j]][k].tab === tab && character[topLevel[j]][k].hash === asset)
                    character[topLevel[j]].splice(k, 1)
        var emotes = Object.keys(character.emotes)
        for (var j = 0; j < emotes.length; j++)
            for (var k = 0; k < character.emotes[emotes[j]].length; k++)
                if (character.emotes[emotes[j]][k].tab === tab && character.emotes[emotes[j]][k].hash === asset)
                    character.emotes[emotes[j]].splice(k, 1)
    },
    deleteCharacter: function(character) {
        for (var i = 0; i < this.project.characters.length; i++) {
            if (this.project.characters[i].id == character.id) {
                this.project.characters.splice(i, 1)
                delete this.characters[character.id]
                if (character.id == this.numCharacters) this.numCharacters--
                break
            }
        }
    },
    getEmptyCharacter: function() {
        this.numCharacters++
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
            "id": this.numCharacters
        })
    },
    getPuppet: function() {
        var puppet = JSON.parse(JSON.stringify(this.characters[this.actor.id]))
        puppet.position = this.actor.position
        puppet.emote = this.actor.emote
        puppet.facingLeft = this.actor.facingLeft
        return puppet
    }
}
