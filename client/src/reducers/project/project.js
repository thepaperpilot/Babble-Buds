import loader, {DEFAULTS} from './loader'
import puppets from './puppets'
import assets from './assets'
import controller from './controller'

const fs = window.require('fs-extra')
const path = require('path')
const remote = window.require('electron').remote
const settingsManager = remote.require('./main-process/settings')
const util = require('./../util')

function updateSetting(state, action) {
    const settings = util.updateObject(state.settings, { [action.name]: action.value })
    return util.updateObject(state, { settings })
}

function save(state, action) {
    const project = settingsManager.settings.openProject
    const thumbnailsPath = path.join(state.settings.charactersPath, '..', 'thumbnails')
    fs.writeFile(project, JSON.stringify(state.project, null, 4))

    state.settings.characters.forEach(character => {
        fs.writeFile(path.join(project, '..', 'characters', character.location), JSON.stringify(state.characters[character.id], null, 4))
        if (fs.existsSync(path.join(thumbnailsPath, 'new-' + character.id + '.png')))
            fs.renameSync(path.join(thumbnailsPath, 'new-' + character.id + '.png'), 
                path.join(thumbnailsPath, character.id + '.png'))
        if (fs.existsSync(path.join(thumbnailsPath, 'new-' + character.id))) {
            if (fs.existsSync(path.join(thumbnailsPath, '' + character.id)))
                fs.removeSync(path.join(thumbnailsPath, '' + character.id))
            fs.renameSync(path.join(thumbnailsPath, 'new-' + character.id), 
                path.join(thumbnailsPath, '' + character.id))
        }
    })

    settingsManager.addRecentProject(action.thumbnail)
    settingsManager.save()

    const oldSettings = JSON.stringify(state.settings)
    const oldCharacters = JSON.stringify(state.characters)
    return util.updateObject(state, { oldSettings, oldCharacters })
}

export default util.createReducer(DEFAULTS, 
    Object.assign(loader, puppets, assets, controller, {
        'UPDATE_SETTING': updateSetting,
        'SAVE': save,
    }))
