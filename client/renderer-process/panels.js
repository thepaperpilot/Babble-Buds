// Imports
const editor = require('./editor')
const controller = require('./controller')
const assets = require('./assets')

const electron = require('electron')
const remote = electron.remote
const PIXI = require('pixi.js')
const path = require('path')
const fs = require('fs-extra')

const settings = remote.require('./main-process/settings')

// Aliases
let Container = PIXI.Container

// Vars
let project
let importing  // used for importing assets from other projects
let topLevel = ["body", "head", "hat", "props"] // The top level containers in puppets

exports.init = function() {
    project = remote.getGlobal('project').project

    document.getElementById('editor-save').addEventListener('click', editor.savePuppet)
    document.getElementById('editor-new').addEventListener('click', newPuppet)
    document.getElementById('editor-duplicate').addEventListener('click', dupePuppet)
    document.getElementById('editor-import').addEventListener('click', importPuppet)
    document.getElementById('import-all-puppets').addEventListener('click', toggleImportAllPuppets)
    document.getElementById('import-puppets-btn').addEventListener('click', confirmImportPuppets)
    document.getElementById('editor-open').addEventListener('click', openPuppetPanel)
    document.getElementById('char open search').addEventListener('keyup', updateCharSearch)
    document.getElementById('char open search').addEventListener('search', updateCharSearch)
    document.getElementById('editor-emotes').addEventListener('click', toggleEmotes)
    for (let i = 0; i < 12; i++) {
        document.getElementById('emote-' + (i + 1)).addEventListener('click', openEmote)
    }
    document.getElementById('emote-name').addEventListener('change', changeEmoteName)
    document.getElementById('emote-enabled').addEventListener('change', toggleEmoteEnabled)
    document.getElementById('emote-mouth').addEventListener('change', toggleBabbleMouth)
    document.getElementById('emote-eyes').addEventListener('change', toggleBabbleEyes)
    document.getElementById('editor-settings').addEventListener('click', toggleSettings)
    document.getElementById('editor-name').addEventListener('change', nameChange)
    document.getElementById('deadbonesstyle').addEventListener('click', bobbleChange)
    document.getElementById('eyeBabbleDuration').addEventListener('change', eyeDurationChange)
    document.getElementById('mouthBabbleDuration').addEventListener('change', mouthDurationChange)
    document.getElementById('delete-character').addEventListener('click', deleteCharacter)
}

exports.updateEmoteDropdown = function() {
    let emotes = Object.keys(editor.character.emotes)
    let select = document.getElementById('editor-emote')
    select.innerHTML = ''
    for (let i = 0; i < emotes.length; i++) {
        let emote = editor.character.emotes[emotes[i]]
        if (emote && emote.enabled) {
            let option = document.createElement('div')
            select.append(option)
            option.outerHTML = '<option>' + emote.name + '</option>'
        }
    }
    editor.puppet.changeEmote()
}

exports.toggleEditorScreen = function(toggle) {
    if (settings.settings.view === 'editor') return
    let enabled = (toggle == null ? document.getElementById('editor-screen').style.display === 'none' : toggle) // jshint ignore: line
    document.getElementById('editor-screen').style.display = enabled ? '' : 'none'
    document.getElementById('editor-layers').style.display = enabled ? '' : 'none'
    if (enabled)
        editor.stage.resize()
}

function newPuppet() {
    editor.setPuppet(JSON.parse(project.getEmptyCharacter()))
}

function dupePuppet() {
    editor.setPuppet(JSON.parse(project.duplicateCharacter(editor.character)))
    editor.resetChanges()
}

function importPuppet() {
    remote.dialog.showOpenDialog(remote.BrowserWindow.getFocusedWindow(), {
        title: 'Select Project',
        defaultPath: path.join(remote.app.getPath('home'), 'projects'),
        filters: [
            {name: 'Babble Buds Project File', extensions: ['babble']},
            {name: 'All Files', extensions: ['*']}
        ],
        properties: [
            'openFile'
        ] 
        }, (filepaths) => {
            if (filepaths) {
                fs.readJson(filepaths[0], (err, project) => {
                    if (err) console.log(err)
                    importing = {}
                    controller.openModal("#importPuppets")
                    document.getElementById('import-all-puppets').checked = false
                    let puppetsList = document.getElementById('import-puppets')
                    puppetsList.innerHTML = ''
                    let projectAssets = {}
                    let oldAssets = {}
                    if (project.assets) {
                        let numAssets = 0
                        let assets = fs.readJsonSync(path.join(filepaths[0], '..', 'assets', project.assets[i].location))
                        let keys = Object.keys(assets)
                        for (let j = 0; j < keys.length; j++) {
                            assets[keys[j]].tab = project.assets[i].name
                            projectAssets["invalid:" + numAssets] = assets[keys[j]]
                            oldAssets[project.assets[i].name][keys[j]] = numAssets
                            numAssets++
                        }
                    } else {
                        projectAssets = fs.readJsonSync(path.join(filepaths[0], '..', 'assets', "assets.json"))
                    }
                    let callback = function(err, character) {
                        // this = {name: string, id: number, location: string}
                        if (err) console.log(err)
                        let puppet = document.createElement('div')                    
                        if (project.assets) {
                            for (let j = 0; j < topLevel.length; j++)
                                for (let k = 0; k < character[topLevel[j]].length; k++) {
                                    character[topLevel[j]][k].id = "invalid:" + oldAssets[character[topLevel[j]][k].tab][character[topLevel[j]][k].hash]
                                    delete character[topLevel[j]][k].tab
                                    delete character[topLevel[j]][k].hash                                }

                            let emotes = Object.keys(character.emotes)
                            for (let j = 0; j < emotes.length; j++) {
                                for (let k = 0; k < character.emotes[emotes[j]].eyes.length; k++) {
                                    character.emotes[emotes[j]].eyes[k].id = "invalid:" + oldAssets[character.emotes[emotes[j]].eyes[k].tab][character.emotes[emotes[j]].eyes[k].hash]
                                    delete character.emotes[emotes[j]].eyes[k].tab
                                    delete character.emotes[emotes[j]].eyes[k].hash
                                }
                                for (let k = 0; k < character.emotes[emotes[j]].mouth.length; k++) {
                                    character.emotes[emotes[j]].mouth[k].id = "invalid:" + oldAssets[character.emotes[emotes[j]].mouth[k].tab][character.emotes[emotes[j]].mouth[k].hash]
                                    delete character.emotes[emotes[j]].mouth[k].tab
                                    delete character.emotes[emotes[j]].mouth[k].hash
                                }
                            }
                        }
                        puppet.id = 'import-puppet-' + this.id
                        puppet.character = character
                        puppet.name = this.name
                        puppet.location = path.join(filepaths[0], '..', 'characters', this.location)
                        puppet.assets = projectAssets
                        puppet.className = "char"
                        puppet.style.backgroundImage = 'url(' + path.join(filepaths[0], '..', 'thumbnails', this.id + '.png?random=' + new Date().getTime()).replace(/\\/g, '/') + ')'
                        puppet.innerHTML = '<div class="desc">' + this.name + '</div>'
                        puppet.addEventListener('click', toggleImportPuppet)
                        puppetsList.appendChild(puppet)
                    }
                    for (let i = 0; i < project.characters.length; i++) {
                        fs.readJson(path.join(filepaths[0], '..', 'characters', project.characters[i].location), callback.bind(project.characters[i]))
                    }
                })
            }
        }
    )
}

function toggleImportAllPuppets(e) {
    let importAll = e.target.checked
    let puppetsList = document.getElementById('import-puppets')
    for (let i = 0; i < puppetsList.childNodes.length; i++) {
        let char = puppetsList.childNodes[i]
        if ((char.className === "char selected") != importAll) {
            toggleImportPuppet({target: char})
        }
    }
}

function toggleImportPuppet(e) {
    if (e.target.className === 'char selected') {
        e.target.className = 'char'
        delete importing[e.target.id]
        document.getElementById('import-all-puppets').checked = false
    } else {
        e.target.className = 'char selected'
        importing[e.target.id] = {character: e.target.character, location: e.target.location, assets: e.target.assets}
    }
}

function confirmImportPuppets() {
    let chars = Object.keys(importing)
    for (let i = 0; i < chars.length; i++) {
        // Find any required assets we don't already have to the project
        let character = JSON.parse(project.duplicateCharacter(importing[chars[i]].character))

        for (let j = 0; j < topLevel.length; j++)
            assets.checkLayer(character[topLevel[j]], importing[chars[i]].assets, importing[chars[i]].location)

        let emotes = Object.keys(character.emotes)
        for (let j = 0; j < emotes.length; j++) {
            assets.checkLayer(character.emotes[emotes[j]].eyes, importing[chars[i]].assets, importing[chars[i]].location)
            assets.checkLayer(character.emotes[emotes[j]].mouth, importing[chars[i]].assets, importing[chars[i]].location)
        }
    }
    // Ensure all assets are loaded so we can save puppets properly
    controller.reloadAssets(() => {
        // Add puppets to project
        let oldcharacter = editor.character
        for (let i = 0; i < chars.length; i++) {
            let character = JSON.parse(project.duplicateCharacter(importing[chars[i]].character))
            editor.setPuppet(character)
            editor.savePuppet()
        }
        // Restore previous puppet
        editor.setPuppet(oldcharacter)
    })
    controller.openModal()
}

function updateCharSearch(e) {
    let list = document.getElementById('char open list')
    if (e.target.value === '') {
        for (let i = 0; i < list.children.length; i++)
            list.children[i].style.display = 'inline-block'
    } else {
        for (let i = 0; i < list.children.length; i++)
            list.children[i].style.display = 'none'
        let chars = list.querySelectorAll("[id*='" + e.target.value.toLowerCase() + "']")
        for (let i = 0; i < chars.length; i++) {
            chars[i].style.display = 'inline-block'
        }
    }
}

function openPuppetPanel() {
    document.getElementById('editor-emotes-panel').style.display = 'none'
    document.getElementById('editor-settings-panel').style.display = 'none'
    document.getElementById('editor-emotes').classList.remove('open-tab')
    document.getElementById('editor-settings').classList.remove('open-tab')
    let panel = document.getElementById('editor-open-panel')
    if (panel.style.display === 'none') {
        exports.toggleEditorScreen(false)
        panel.style.display = ''
        document.getElementById('editor-open').classList.add('open-tab')
    } else if (settings.settings.view !== 'editor') {
        exports.toggleEditorScreen(true)
        panel.style.display = 'none'
        document.getElementById('editor-open').classList.remove('open-tab')
    }
}

function toggleEmotes() {
    document.getElementById('editor-open-panel').style.display = 'none'
    document.getElementById('editor-settings-panel').style.display = 'none'
    document.getElementById('editor-open').classList.remove('open-tab')
    document.getElementById('editor-settings').classList.remove('open-tab')
    let panel = document.getElementById('editor-emotes-panel')
    if (panel.style.display === 'none') {
        exports.toggleEditorScreen(false)
        panel.style.display = ''
        document.getElementById('editor-emotes').classList.add('open-tab')
        for (let i = 0; i < editor.character.emotes.length; i++) {
            document.getElementById('emote-' + (i + 1)).emote = i
            if (editor.character.emotes[i].enabled) {
                document.getElementById('emote-' + (i + 1)).className = "emote available"
            } else {
                document.getElementById('emote-' + (i + 1)).className = "emote"
            }
        }
        openEmote({target: document.getElementById('emote-1')})
    } else if (settings.settings.view !== 'editor') {
        exports.toggleEditorScreen(true)
        panel.style.display = 'none'
        document.getElementById('editor-emotes').classList.remove('open-tab')
    }
}

function openEmote(e) {
    let emote = editor.character.emotes[e.target.emote]
    document.getElementById('emote-name').value = emote.name
    document.getElementById('emote-name').disabled = e.target.emote === 0
    document.getElementById('emote-name').emote = e.target.emote
    document.getElementById('emote-enabled').checked = emote && emote.enabled
    document.getElementById('emote-eyes').checked = editor.character.eyes.indexOf(e.target.emote) > -1
    document.getElementById('emote-mouth').checked = editor.character.mouths.indexOf(e.target.emote) > -1
    document.getElementById('emote-enabled').disabled = e.target == document.getElementById('emote-1')
    document.getElementById('emote-enabled').button = e.target
}

function changeEmoteName(e) {
    let emote = e.target.emote
    editor.character.emotes[emote].name = e.target.value
    exports.updateEmoteDropdown()
    document.getElementById('emote-' + (emote + 1)).innerText = e.target.value
    editor.recordChange()
}

function toggleEmoteEnabled(e) {
    let emote = document.getElementById('emote-name').emote
    if (editor.character.emotes[emote] && editor.character.emotes[emote].enabled && emote !== 'default') {
        editor.character.emotes[emote].enabled = false
        e.target.button.classList.remove('available')
        exports.updateEmoteDropdown()
    } else {
        if (editor.character.emotes[emote]) {
            editor.character.emotes[emote].enabled = true
            editor.setPuppet(editor.character, true, true)
            e.target.button.className += " available"
            exports.updateEmoteDropdown()
        } else {
            editor.character.emotes[emote] = {
                "enabled": true,
                "mouth": [],
                "eyes": []
            }
            editor.puppet.emotes[emote] = {
                "mouth": new Container(),
                "eyes": new Container()
            }
            editor.puppet.mouthsContainer.addChild(editor.puppet.emotes[emote].mouth)
            editor.puppet.eyesContainer.addChild(editor.puppet.emotes[emote].eyes)
            e.target.button.className += " available"
            exports.updateEmoteDropdown()
        }
    }
    editor.recordChange()
}

function toggleBabbleMouth() {
    let emote = document.getElementById('emote-name').emote
    let index = editor.character.mouths.indexOf(emote)
    if (index > -1) {
        editor.character.mouths.splice(index, 1)
    } else {
        editor.character.mouths.push(emote)
    }
    editor.recordChange()
}

function toggleBabbleEyes() {
    let emote = document.getElementById('emote-name').emote
    let index = editor.character.eyes.indexOf(emote)
    if (index > -1) {
        editor.character.eyes.splice(index, 1)
    } else {
        editor.character.eyes.push(emote)
    }
    editor.recordChange()
}

function toggleSettings() {
    document.getElementById('editor-open-panel').style.display = 'none'
    document.getElementById('editor-emotes-panel').style.display = 'none'
    document.getElementById('editor-open').classList.remove('open-tab')
    document.getElementById('editor-emotes').classList.remove('open-tab')
    let panel = document.getElementById('editor-settings-panel')
    if (panel.style.display === 'none') {
        exports.toggleEditorScreen(false)
        panel.style.display = ''
        document.getElementById('editor-settings').classList.add('open-tab')
    } else if (settings.settings.view !== 'editor') {
        exports.toggleEditorScreen(true)
        panel.style.display = 'none'
        document.getElementById('editor-settings').classList.remove('open-tab')
    }
}

function nameChange(e) {
    editor.character.name = e.target.value
    editor.recordChange()
}

function bobbleChange(e) {
    editor.character.deadbonesStyle = e.target.checked
    editor.recordChange()
}

function eyeDurationChange(e) {
    editor.character.eyeBabbleDuration = e.target.value
    editor.recordChange()
}

function mouthDurationChange(e) {
    editor.character.mouthBabbleDuration = e.target.value
    editor.recordChange()
}

function deleteCharacter() {
    if (editor.character.id == project.actor.id) {
        status.error("You can't delete your active character. Please switch characters and try again.")
        return
    }
    project.deleteCharacter(editor.character)
    controller.deleteCharacter(editor.character)
    editor.reloadPuppetList()
    document.getElementById('editor-screen').style.display = ''
    document.getElementById('editor-settings-panel').style.display = 'none'
    document.getElementById('editor-settings').classList.remove('open-tab')
    if (settings.settings.view === 'editor') {
        document.getElementById('editor-open-panel').style.display = ''
        document.getElementById('editor-open').classList.add('open-tab')
    }
    editor.setPuppet(project.characters[project.actor.id], true)
}
