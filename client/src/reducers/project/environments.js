import { DEFAULT_ENVIRONMENT } from './defaults'
import assets from './assets'

const path = window.require('path')
const fs = window.require('fs-extra')
const util = require('./../util')

const { remote, ipcRenderer } = window.require('electron')
const settingsManager = remote.require('./main-process/settings')

function changeEnvironment(state, action) {
    const environment = util.updateObject(state.settings.environments[action.environment], {
        [action.key]: action.value
    })
    const environments = state.settings.environments.slice()
    environments[action.environment] = environment
    const settings = util.updateObject(state.settings, { environments })
    return util.updateObject(state, { settings })
}

function duplicateEnvironment(state, action) {
    const environment = JSON.parse(JSON.stringify(state.settings.environments[action.environment] || state.defaultEnvironment))
    const id = state.numCharacters + 1
    const thumbnail = state.characterThumbnails[environment.id] || ''
    environment.id = id
    const environmentThumbnail = `file:///${thumbnail.split('/').slice(0, -1).join('/')}/new-${id}.png`

    if (thumbnail) {
        fs.removeSync(`${thumbnail.slice(8).split('/').slice(0, -1).join('/')}/new-${id}`)
        if (fs.existsSync(thumbnail.slice(8)))
            fs.copySync(thumbnail.slice(8), `${thumbnail.slice(8).split('/').slice(0, -1).join('/')}/new-${id}.png`)
    }

    environment.name = `${environment.name} (Copy)`
    
    const environments = [...state.settings.environments, environment]
    const characterThumbnails = util.updateObject(state.characterThumbnails, {
        [id]: environmentThumbnail
    })
    const numCharacters = state.numCharacters + 1
    const settings = util.updateObject(state.settings, { environments })

    ipcRenderer.send('background', 'generate thumbnails', `${thumbnail.slice(8).split('/').slice(0, -1).join('/')}/new-${id}`,
        environment, 'environment', id)
    
    return util.updateObject(state, { characterThumbnails, numCharacters, settings })
}

function deleteEnvironment(state, action) {
    const environments = [...state.settings.environments]
    const environment = state.settings.environments[action.environment]
    environments.splice(action.environment, 1)
    const characterThumbnails = util.updateObject(state.characterThumbnails)
    delete characterThumbnails[environment.id]
    const env = state.settings.environment === action.environment ? -1 : state.settings.environment
    const settings = util.updateObject(state.settings, { environments, environment: env })
    return util.updateObject(state, { settings, characterThumbnails })
}

function newEnvironment(state) {
    const environment = JSON.parse(JSON.stringify(DEFAULT_ENVIRONMENT))
    const id = environment.id = state.numCharacters + 1
    const environmentThumbnail =
        `file:///${path.join(state.settings.charactersPath, '..', 'thumbnails',
            `new-${id}.png`)}`.replace(/\\/g, '/')

    fs.removeSync(`${path.join(state.settings.charactersPath, '..', 'thumbnails',
        `new-${id}.png`)}`)
    fs.removeSync(`${path.join(state.settings.charactersPath, '..', 'thumbnails',
        `new-${id}`)}`)

    environment.creator = settingsManager.settings.uuid
    environment.creatorNick = state.settings.nickname
    environment.oc = settingsManager.settings.uuid
    environment.ocNick = state.settings.nickname

    const environments = state.settings.environments.slice()
    environments.push(environment)
    const characterThumbnails = util.updateObject(state.characterThumbnails, {
        [id]: environmentThumbnail
    })
    const numCharacters = id
    const settings = util.updateObject(state.settings, { environments })

    return util.updateObject(state, {
        characterThumbnails,
        numCharacters,
        settings
    })
}

function addEnvironments(state, action) {
    let numCharacters = state.numCharacters
    const environments = state.settings.environments.slice()
    const characterThumbnails = util.updateObject(state.characterThumbnails)

    action.environments.forEach(env => {
        if (numCharacters < env.id) numCharacters = env.id
        environments.push(env)
        characterThumbnails[env.id] =
            `file:///${path.join(state.project, state.settings.charactersPath,
                '..', 'thumbnails', `new-${env.id}.png`)}`.replace(/\\/g, '/')
    })
    
    const settings = util.updateObject(state.settings, { environments })

    return assets['ADD_ASSETS'](util.updateObject(state, {
        settings,
        characterThumbnails,
        numCharacters
    }), action)
}

function updateThumbnails(state, action) {
    const characterThumbnails = util.updateObject(state.characterThumbnails, {
        [action.id]: `file:///${action.thumbnailsPath}.png?random=${new Date().getTime()}`.replace(/\\/g, '/')
    })

    return util.updateObject(state, { characterThumbnails })
}

export default {
    'CHANGE_ENVIRONMENT': changeEnvironment,
    'DUPLICATE_ENVIRONMENT': duplicateEnvironment,
    'DELETE_ENVIRONMENT': deleteEnvironment,
    'NEW_ENVIRONMENT': newEnvironment,
    'ADD_ENVIRONMENTS': addEnvironments,
    'UPDATE_ENVIRONMENT_THUMBNAILS': updateThumbnails
}
