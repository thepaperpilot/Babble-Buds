const fs = require('fs-extra')
const remote = require('electron').remote
const dialog = remote.dialog
const main = remote.require('./main')
const settings = remote.require('./main-process/settings')
const menu = remote.require('./main-process/menus/application-menu')
const controller = require('./controller')
const editor = require('./editor')

const path = require('path')

module.exports = {
    // project: {},
    // characters: {},
    // charactersPath: "",
    // assetsPath: "",
    // numCharacters: 0,
    // actor: {},
	readProject: function() {
		if (!this.checkChanges()) return

        let filepath = remote.getGlobal('project').filepath
		fs.readJson(filepath, (err, proj) => {
			if (err) {
				main.redirect('welcome.html')
				return
			}

			remote.getGlobal('project').project = this
			this.project = proj
			this.oldProject = JSON.stringify(proj)
			this.characters = {}
			this.assets = {}
			this.charactersPath = path.join(filepath, '..', 'characters')
			this.assetsPath = path.join(filepath, '..', 'assets')
			this.numCharacters = 0
			for (let i = 0; i < proj.characters.length; i++) {
				let character = this.characters[proj.characters[i].id] = fs.readJsonSync(path.join(this.charactersPath, proj.characters[i].location))
				character.name = proj.characters[i].name
				character.id = proj.characters[i].id
				if (proj.characters[i].id > this.numCharacters)
					this.numCharacters = proj.characters[i].id
				if (Object.prototype.toString.call(character.emotes) === "[object Object]") {
					// Convert from object to array
					let arr = []
					let emotes = ['default', 'happy', 'wink', 'kiss', 'angry', 'sad', 'ponder', 'gasp', 'veryangry', 'verysad', 'confused', 'ooo']
					for (let i = 0; i < emotes.length; i++) {
						if (character.emotes[emotes[i]]) {
							let emote = character.emotes[emotes[i]]
							emote.name = emotes[i]
							arr.push(emote)
						} else {
							arr.push({
								enabled: false,
								mouth: [],
								eyes: [],
								name: emotes[i]
							})
						}
					}
					character.emotes = arr
					character.emote = emotes.indexOf(character.emote || "default")
					if (proj.actor.id === character.id) {
						proj.actor.emote = emotes.indexOf(character.emote || "default")
					}
					for (let i = 0; i < character.eyes.length; i++) {
						character.eyes[i] = emotes.indexOf(character.eyes[i] || "default")
					}
					for (let i = 0; i < character.mouths.length; i++) {
						character.mouths[i] = emotes.indexOf(character.mouths[i] || "default")
					}
				}
			}
			this.oldCharacters = JSON.stringify(this.characters)
			this.actor = proj.actor

			// Old version of assets
			if (proj.assets) {
				this.assets = {}
				this.project.numAssets = 0
				let oldAssets = {}
				for (let i = 0; i < proj.assets.length; i++) {
					let assets = fs.readJsonSync(path.join(this.assetsPath, proj.assets[i].location))
					oldAssets[proj.assets[i].name] = {}
					let keys = Object.keys(assets)
					for (let j = 0; j < keys.length; j++) {
						assets[keys[j]].tab = proj.assets[i].name
						this.assets[settings.settings.uuid + ":" + this.project.numAssets] = assets[keys[j]]
						oldAssets[proj.assets[i].name][keys[j]] = this.project.numAssets
						this.project.numAssets++
					}
				}

				// Update asset references in puppets
				let keys = Object.keys(this.characters)
				for (let i = 0; i < keys.length; i++) {
					let character = this.characters[keys[i]]
			    	let topLevel = ["body", "head", "hat", "props"]

			    	for (let j = 0; j < topLevel.length; j++)
				        for (let k = 0; k < character[topLevel[j]].length; k++) {
				        	character[topLevel[j]][k].id = settings.settings.uuid + ":" + oldAssets[character[topLevel[j]][k].tab][character[topLevel[j]][k].hash]
				        	delete character[topLevel[j]][k].tab
				        	delete character[topLevel[j]][k].hash
				        }

				    let emotes = Object.keys(character.emotes)
				    for (let j = 0; j < emotes.length; j++) {
				    	for (let k = 0; k < character.emotes[emotes[j]].eyes.length; k++) {
				    		character.emotes[emotes[j]].eyes[k].id = settings.settings.uuid + ":" + oldAssets[character.emotes[emotes[j]].eyes[k].tab][character.emotes[emotes[j]].eyes[k].hash]
				        	delete character.emotes[emotes[j]].eyes[k].tab
				        	delete character.emotes[emotes[j]].eyes[k].hash
				    	}
				    	for (let k = 0; k < character.emotes[emotes[j]].mouth.length; k++) {
				    		character.emotes[emotes[j]].mouth[k].id = settings.settings.uuid + ":" + oldAssets[character.emotes[emotes[j]].mouth[k].tab][character.emotes[emotes[j]].mouth[k].hash]
				        	delete character.emotes[emotes[j]].mouth[k].tab
				        	delete character.emotes[emotes[j]].mouth[k].hash
				    	}
				    }
				}
				delete this.project.assets
			} else {
				this.assets = fs.readJsonSync(path.join(this.assetsPath, "assets.json"))
			}

			for (let i = 0; i < this.project.characters.length; i++) {
				fs.removeSync(path.join(this.assetsPath, '..', 'thumbnails', 'new-' + this.project.characters[i].id + '.png'))
				fs.removeSync(path.join(this.assetsPath, '..', 'thumbnails', 'new-' + this.project.characters[i].id))
			}

			settings.settings.openProject = filepath
			settings.save()
            controller.init()
			menu.updateMenu()
		})
	},
	saveProject: function() {
		fs.writeFile(settings.settings.openProject, JSON.stringify(this.project, null, 4))
		fs.writeFile(path.join(settings.settings.openProject, '..', 'assets', 'assets.json'), JSON.stringify(this.assets, null, 4))
		for (let i = 0; i < this.project.characters.length; i++) {
			fs.writeFile(path.join(settings.settings.openProject, '..', 'characters', this.project.characters[i].location), JSON.stringify(this.characters[this.project.characters[i].id], null, 4))
			if (fs.existsSync(path.join(this.assetsPath, '..', 'thumbnails', 'new-' + this.project.characters[i].id + '.png')))
                fs.renameSync(path.join(this.assetsPath, '..', 'thumbnails', 'new-' + this.project.characters[i].id + '.png'), 
                	path.join(this.assetsPath, '..', 'thumbnails', this.project.characters[i].id + '.png'))
            if (fs.existsSync(path.join(this.assetsPath, '..', 'thumbnails', 'new-' + this.project.characters[i].id))) {
            	if (fs.existsSync(path.join(this.assetsPath, '..', 'thumbnails', '' + this.project.characters[i].id)))
            		fs.removeSync(path.join(this.assetsPath, '..', 'thumbnails', '' + this.project.characters[i].id))
                fs.renameSync(path.join(this.assetsPath, '..', 'thumbnails', 'new-' + this.project.characters[i].id), 
                	path.join(this.assetsPath, '..', 'thumbnails', "" + this.project.characters[i].id))
            }
		}
		settings.addRecentProject(controller.getThumbnail())
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
		editor.clear()
		menu.updateMenu()

		main.redirect('welcome.html')
	},
	// Returns true if its okay to close the project
	checkChanges: function() {
		if (!editor.checkChanges())
        	return false
		let changes = this.oldProject !== JSON.stringify(this.project)
		changes = changes || this.oldAssets !== JSON.stringify(this.assets)
		changes = changes || this.oldCharacters !== JSON.stringify(this.characters)
		if (changes) {
			let response = dialog.showMessageBox({
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
	getNewAssetId: function() {
		return this.project.numAssets++
	},
	addAsset: function(id, asset) {
		this.assets[id] = asset
	},
	renameAsset: function(id, name) {
		this.assets[id].name = name
	},
	renameAssetList: function(tab, newTab) {
		this.assets[newTab] = this.assets[tab]
		delete this.assets[tab]
		let list = this.project.assets.find((x) => x.name === tab)
		list.name = newTab
		list.location = newTab + ".json"
	},
    deleteAsset: function(id) {
        delete this.assets[id]
    },
    saveCharacter: function(character) {
        let char = null
        for (let i = 0; i < this.project.characters.length; i++) {
            if (this.project.characters[i].id == character.id) {
                char = this.project.characters[i]
                break
            }
        }
        if (char === null)
            this.project.characters.push({"name": character.name, "id": character.id, "location": character.id + '.json'})
        else
        	char.name = character.name
        this.characters[character.id] = character
    },
    duplicateCharacter: function(character) {
        this.numCharacters++
        let char = JSON.parse(JSON.stringify(character))
        char.id = this.numCharacters
        return JSON.stringify(char)
    },
    deleteCharacter: function(character) {
        for (let i = 0; i < this.project.characters.length; i++) {
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
            "emotes": [
		        {
		            "enabled": true,
		            "mouth": [],
		            "eyes": [],
		            "name": "default"
		        },
		        {
		            "enabled": false,
		            "mouth": [],
		            "eyes": [],
		            "name": "happy"
		        },
		        {
		            "enabled": false,
		            "mouth": [],
		            "eyes": [],
		            "name": "wink"
		        },
		        {
		            "enabled": false,
		            "mouth": [],
		            "eyes": [],
		            "name": "kiss"
		        },
		        {
		            "enabled": false,
		            "mouth": [],
		            "eyes": [],
		            "name": "angry"
		        },
		        {
		            "enabled": false,
		            "mouth": [],
		            "eyes": [],
		            "name": "sad"
		        },
		        {
		            "enabled": false,
		            "mouth": [],
		            "eyes": [],
		            "name": "ponder"
		        },
		        {
		            "enabled": false,
		            "mouth": [],
		            "eyes": [],
		            "name": "gasp"
		        },
		        {
		            "enabled": false,
		            "mouth": [],
		            "eyes": [],
		            "name": "veryangry"
		        },
		        {
		            "enabled": false,
		            "mouth": [],
		            "eyes": [],
		            "name": "verysad"
		        },
		        {
		            "enabled": false,
		            "mouth": [],
		            "eyes": [],
		            "name": "confused"
		        },
		        {
		            "enabled": false,
		            "mouth": [],
		            "eyes": [],
		            "name": "ooo"
		        }
		    ],
            "props": [],
            "name": "New Puppet",
            "id": this.numCharacters
        })
    },
    getPuppet: function() {
        let puppet = JSON.parse(JSON.stringify(this.characters[this.actor.id]))
        puppet.position = this.actor.position
        puppet.emote = this.actor.emote
        puppet.facingLeft = this.actor.facingLeft
        return puppet
    }
}
