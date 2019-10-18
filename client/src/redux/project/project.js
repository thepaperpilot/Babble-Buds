import { combineReducers } from 'redux'
import util from '../util.js'
import folders from './folders'
import saver, { load as loadProject } from './saver'
import settings, { setSettings } from './settings/settings'
import characters, { setCharacters } from './characters/reducers'
import environments, { setEnvironments } from './environments/reducers'
import assets, { setAssets } from './assets/reducers'
import characterThumbnails, { setThumbnails } from './characterThumbnails'
import dirtyCharacters, { addCharacters, clearCharacters } from './dirtyCharacters'
import { loadCharacters, loadAssets } from './loader'
import { setEnvironment, setDefaultEnvironment } from '../environment'
import { setSinglePlayer } from '../networking'
import { clearActors } from '../actors'
import { setActors } from '../controller'
import { warn } from '../status'

const fs = window.require('fs-extra')
const path = window.require('path')
const semver = window.require('semver')
const {remote, ipcRenderer} = window.require('electron')
const settingsManager = remote.require('./main-process/settings')
const menu = remote.require('./main-process/menus/application-menu')

// Action Types
const SET_PROJECT = 'project/SET_PROJECT'
const SET_NUM_CHARACTERS = 'project/SET_NUM_CHARACTERS'
const SET_CHARACTERS_PATH = 'project/SET_CHARACTERS_PATH'
const SET_ASSETS_PATH = 'project/SET_ASSETS_PATH'

// Utility Functions
// Check if this project is either new or made with this version of Babble Buds
function confirmOpen(clientVersion) {
    let compare = clientVersion ?
        semver.compare(clientVersion, remote.app.getVersion()) :
        -1
    if (compare !== 0) {
        let options = {
            'type': 'question',
            'buttons': ['Cancel', 'Open Anyways'],
            'defaultId': 0,
            'title': 'Open Project?',
            'cancelId': 0
        }
        if (compare > 0) {
            options.message = 'You are attempting to open a project made with a more recent version of Babble Buds.'
            options.detail = 'Caution is advised. Saving this project will downgrade it to this version of Babble Buds, and may cause problems or lose features.'
        } else {
            options.message = 'You are attempting to open a project made with a less recent version of Babble Buds.'
            options.detail = 'Opening this project will upgrade it to this version of Babble Buds.'
        }

        // If the player cancels, then don't open the project
        if (remote.dialog.showMessageBox(options) === 0)
            return false
    }
    return true
}

// Filter out any character layers for assets that don't exist
function filterCharacters(dispatch, assets, characters) {
    const dirtyCharacters = []
    const filterAssets = c => layer => {
        if (layer.children) {
            layer.children = layer.children.filter(filterAssets(c))
        }
        if (!('id' in layer) || layer.id in assets)
            return true
        else {
            if (!dirtyCharacters.includes(c))
                dirtyCharacters.push(c)
            dispatch(warn(`Removing layer "${layer.name}" from "${c.name}" puppet because that asset doesn't exist.`))
            return false
        }
    }
    Object.keys(characters).forEach(c =>
        characters[c].layers.children = characters[c].layers.children.filter(filterAssets(c)))
    return dirtyCharacters
}

// Action Creators
export function close() {
    return (dispatch, getState) => {
        dispatch({ type: SET_PROJECT, project: null })
        dispatch(setSettings(getState().defaults.settings))
        dispatch(setCharacters({}))
        dispatch(setEnvironments({}))
        dispatch(setThumbnails({}))
        dispatch(clearCharacters())
        dispatch(setAssets({}))
        dispatch(clearActors())
        dispatch(setActors([]))
    }
}

export function load(filepath) {
    return (dispatch, getState) => {
        const state = getState()
        filepath = filepath.replace(/\\/g, '/')

        if (!fs.existsSync(filepath)) {
            dispatch(warn(`Couldn't find a project at ${filepath}`))
            return
        }

        // Loads project settings with defaults
        const settings = util.updateObject(state.defaults.settings, fs.readJsonSync(filepath))

        // Confirm loading project if mismatched versions
        if (!confirmOpen())
            return

        // Mark this filepath as the currently open project
        settingsManager.settings.openProject = filepath
        settingsManager.save()
        menu.updateMenu(true)

        // Load assets and characters and environments
        const assetsPath = path.join(filepath, settings.assetsPath || '../assets')
        let {characters, environments, characterThumbnails, numCharacters, converted} =
            loadCharacters(settings, path.join(filepath, settings.charactersPath), state.defaults)
        const {assets} = loadAssets(settings, assetsPath, characters)
        delete settings.assets

        // Update old stage settings to new environments system
        if ('greenScreen' in settings) {
            // If they had a custom setup, create a environment to store it
            if (settings.greenScreen != '#00FF00' ||
                settings.numCharacters != 5 ||
                settings.puppetScale != 1) {
                const color = settings.greenScreen == '#00FF00' ?
                    state.defaults.environment.color : settings.greenScreen
                const environment = util.updateObject(state.defaults.environment, {
                    'name': 'Legacy',
                    'color': color,
                    'numCharacters': settings.numCharacters,
                    'puppetScale': settings.puppetScale
                })
                environments[numCharacters + 1] = environment
                settings.environments = [...settings.environments, {
                    'id': numCharacters + 1,
                    'location': `${numCharacters + 1}.json`
                }]
                ipcRenderer.send('background', 'generate thumbnails',
                    `${path.join(filepath, settings.charactersPath, '..',
                        'thumbnails', `${numCharacters + 1}`)}`.replace(/\\/g, '/'),
                    environment, 'environment', numCharacters + 1)
                dispatch(setEnvironment(settingsManager.settings.uuid,
                    numCharacters + 1, environment))
                numCharacters++
            } else dispatch(setDefaultEnvironment())

            // Delete old values we don't need anymore
            delete settings.greenScreen
            delete settings.numCharacters
            delete settings.puppetScale
        } else dispatch(setDefaultEnvironment())

        // Remove any character layers for assets that don't exist in this project
        let dirtyCharacters = filterCharacters(dispatch, assets, characters)

        // Update layer names if converted to new layers system
        if (converted) {
            dirtyCharacters = Object.keys(characters)
            const updateAsset = layer => {
                if (layer.children) {
                    layer.children.forEach(updateAsset)
                } else {
                    layer.name = assets[layer.id].name
                }
            }
            Object.values(characters).forEach(character =>
                updateAsset(character.layers))
        }

        // Set ALL the things!
        dispatch({ type: SET_NUM_CHARACTERS, numCharacters })
        dispatch({ type: SET_CHARACTERS_PATH, charactersPath: path.join(filepath, settings.charactersPath) })
        dispatch({ type: SET_ASSETS_PATH, assetsPath: `file:///${path.join(filepath, settings.assetsPath)}` })
        dispatch(setSettings(settings))
        dispatch(setCharacters(characters))
        dispatch(setEnvironments(environments))
        dispatch(setThumbnails(characterThumbnails))
        dispatch(addCharacters(dirtyCharacters))
        dispatch(setAssets(assets))
        dispatch(loadProject(settings, characters, environments, assets))
        dispatch(setSinglePlayer())
        dispatch({ type: SET_PROJECT, project: filepath })
    }
}

export function setNumCharacters(numCharacters) {
    return { type: SET_NUM_CHARACTERS, numCharacters }
}

// Reducers
const projectReducer = util.createReducer(null, {
    [SET_PROJECT]: (state, action) => action.project
})

const numCharactersReducer = util.createReducer(0, {
    [SET_NUM_CHARACTERS]: (state, action) => action.numCharacters
})

const charactersPathReducer = util.createReducer('', {
    [SET_CHARACTERS_PATH]: (state, action) => action.charactersPath
})

const assetsPathReducer = util.createReducer('', {
    [SET_ASSETS_PATH]: (state, action) => action.assetsPath
})

export default combineReducers({
    project: projectReducer,
    numCharacters: numCharactersReducer,
    charactersPath: charactersPathReducer,
    assetsPath: assetsPathReducer,
    settings,
    characters,
    environments,
    characterThumbnails,
    dirtyCharacters,
    assets,
    folders,
    saver
})
