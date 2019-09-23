import loader from './loader'
import puppets from './puppets'
import assets from './assets'
import controller from './controller'
import environments from './environments'
import { DEFAULTS } from './defaults'

// taken from https://wiki.urealms.com/wiki/List_of_Minor_Characters - Updated 2018-01-08
import names from './../../data/names.json'

const fs = window.require('fs-extra')
const path = require('path')
const remote = window.require('electron').remote
const settingsManager = remote.require('./main-process/settings')
const util = require('./../util')

function updateSetting(state, action) {
    const settings = util.updateObject(state.settings, { [action.name]: action.value })
    return util.updateObject(state, { settings })
}

function updateGlobalShortcut(state, action) {
    // Unregister the old shortcut, and register the new one
    window.require('electron').ipcRenderer.send('global', [
        {
            accel: state.settings.shortcuts[action.shortcut],
            shortcut: action.shortcut
        }
    ], [
        {
            accel: action.value,
            shortcut: action.shortcut
        }
    ])
    const shortcuts = util.updateObject(state.settings.shortcuts, {
        [action.shortcut]: action.value
    })
    const settings = util.updateObject(state.settings, { shortcuts })
    return util.updateObject(state, { settings })   
}

function save(state, action) {
    const project = settingsManager.settings.openProject
    const thumbnailsPath = path.join(state.settings.charactersPath, '..', 'thumbnails')
    fs.writeFile(project, JSON.stringify(state.project, null, 4))

    state.settings.characters.forEach(character => {
        fs.writeFile(path.join(project, '..', 'characters', character.location), JSON.stringify(state.characters[character.id], null, 4))
        if (fs.existsSync(path.join(thumbnailsPath, `new-${character.id}.png`)))
            fs.renameSync(path.join(thumbnailsPath, `new-${character.id}.png`), 
                path.join(thumbnailsPath, `${character.id}.png`))
        if (fs.existsSync(path.join(thumbnailsPath, `new-${character.id}`))) {
            if (fs.existsSync(path.join(thumbnailsPath, `${character.id}`)))
                fs.removeSync(path.join(thumbnailsPath, `${character.id}`))
            fs.renameSync(path.join(thumbnailsPath, `new-${character.id}`), 
                path.join(thumbnailsPath, `${character.id}`))
        }
    })

    settingsManager.addRecentProject(action.thumbnail)
    settingsManager.save()

    const oldSettings = JSON.stringify(state.settings)
    const oldCharacters = JSON.stringify(state.characters)
    return util.updateObject(state, { oldSettings, oldCharacters })
}

function randomizeName(state) {
    const settings = util.updateObject(state.settings, {
        nickname: names[Math.floor(Math.random() * names.length)]
    })
    return util.updateObject(state, { settings })
}

export default util.createReducer(DEFAULTS, 
    Object.assign(loader, puppets, assets, environments, controller, {
        'UPDATE_SETTING': updateSetting,
        'EDIT_GLOBAL_SHORTCUT': updateGlobalShortcut,
        'SAVE': save,
        'RANDOMIZE_NICKNAME': randomizeName
    }))
