import {Puppet} from 'babble.js'
import { DEFAULTS, DEFAULT_CHARACTER, DEFAULT_ENVIRONMENT } from './defaults'

const path = require('path')
const fs = window.require('fs-extra')
const semver = window.require('semver')
const {remote, ipcRenderer} = window.require('electron')
const settingsManager = remote.require('./main-process/settings')
const menu = remote.require('./main-process/menus/application-menu')

const util = require('./../util')

export function loadCharacters(settings, charactersPath) {
    const characters = {}
    const characterThumbnails = {}
    let converted = false

    let numCharacters = 0
    for (let i = 0; i < settings.characters.length; i++) {
        const loadedCharacter = fs.readJsonSync(path.join(charactersPath, settings.characters[i].location))
        let character = characters[settings.characters[i].id] =
            Object.assign({}, DEFAULT_CHARACTER, settings.characters[i], loadedCharacter)
        character.creator = settingsManager.settings.uuid
        character.creatorNick = settings.nickname
        if (character.oc == null) {
            character.oc = settingsManager.settings.uuid
            character.ocNick = settings.nickname
        }
        characterThumbnails[settings.characters[i].id] = `file:///${path.join(charactersPath, '..', 'thumbnails',
            `${settings.characters[i].id}.png`)}`.replace(/\\/g, '/')

        if (character.id > numCharacters)
            numCharacters = character.id

        const emotes = ['default', 'happy', 'wink', 'kiss', 'angry', 'sad', 'ponder', 'gasp', 'veryangry', 'verysad', 'confused', 'ooo']
        // Backwards compatibility: Convert from old emote system
        if (Object.prototype.toString.call(character.emotes) === '[object Object]') {
            let arr = []
            for (let j = 0; j < emotes.length; j++) {
                if (character.emotes[emotes[j]]) {
                    let emote = character.emotes[emotes[j]]
                    emote.name = emotes[j]
                    arr.push(emote)
                } else {
                    arr.push({
                        enabled: false,
                        mouth: [],
                        eyes: [],
                        name: emotes[j]
                    })
                }
            }
            character.emotes = arr
            character.emote = emotes.indexOf(character.emote || 'default')
            if (settings.actor.id === character.id) {
                settings.actor.emote = emotes.indexOf(character.emote || 'default')
            }
            for (let i = 0; i < character.eyes.length; i++) {
                character.eyes[i] = emotes.indexOf(character.eyes[i] || 'default')
            }
            for (let i = 0; i < character.mouths.length; i++) {
                character.mouths[i] = emotes.indexOf(character.mouths[i] || 'default')
            }
        }

        const layers = ['body', 'head', 'hat', 'props']
        // Backwards compatibility: Convert from old layers system
        if ('body' in character) {
            converted = true
            const layer = character.layers = { children: [] }
            layers.forEach(l => {
                const child = {
                    name: l,
                    children: character[l].map(e => {
                        e.leaf = 'true'
                        return e
                    })
                }
                if (l === 'hat' || l === 'head')
                    child.head = true
                layer.children.push(child)
            })
            const emotes = []
            character.emotes.forEach((e, i) => {
                if (!e.enabled) return
                emotes.push({
                    name: e.name,
                    emote: i,
                    children: e.mouth.map(e => {
                        e.emoteLayer = 'mouth'
                        if (character.mouths.includes(i)) e.babble = true
                        return e
                    }).concat(e.eyes.map(e => {
                        e.emoteLayer = 'eyes'
                        if (character.eyes.includes(i)) e.babble = true
                        return e
                    })).map(e => {
                        e.leaf = 'true'
                        return e
                    })
                })
            })
            layer.children.splice(2, 0, {
                name: 'emotes',
                head: true,
                children: emotes
            })

            delete character.emotes
            delete character.mouths
            delete character.eyes
            delete character.bundles
            layers.forEach(l => delete character[l])
        }

        for (let j = 0; j < emotes.length; j++)
            if (fs.existsSync(path.join(charactersPath, '..', 'thumbnails', `${settings.characters[i].id}`, `${emotes[j]}.png`)))
                fs.moveSync(path.join(charactersPath, '..', 'thumbnails', `${settings.characters[i].id}`, `${emotes[j]}.png`),
                    path.join(charactersPath, '..', 'thumbnails', `${settings.characters[i].id}`, `${j}.png`))
    }

    settings.environments.forEach(env => {
        // TODO if we ever need to add backwards-compatibility checks for environments,
        // it may be better to extract out a processCharacter function and feed environments
        // through it as well
        
        characterThumbnails[env.id] = `file:///${path.join(charactersPath, '..', 'thumbnails',
            `${env.id}.png`)}`.replace(/\\/g, '/')
        fs.remove(path.join(charactersPath, '..', 'thumbnails', `new-${env.id}.png`))
        fs.remove(path.join(charactersPath, '..', 'thumbnails', `new-${env.id}`))

        if (env.id > numCharacters)
            numCharacters = env.id
    })

    return {characters, characterThumbnails, numCharacters, converted}
}

export function loadAssets(settings, assetsPath, characters) {
    if (settings.assets) {
        // Backwards compatibility: Convert from old-style assets
        const newAssets = {}
        const folders = []
        let oldAssets = {}
        for (let i = 0; i < settings.assets.length; i++) {
            let assets = fs.readJsonSync(path.join(assetsPath, settings.assets[i].location))
            oldAssets[settings.assets[i].name] = {}
            let keys = Object.keys(assets)
            folders.push(settings.assets[i].name)
            for (let j = 0; j < keys.length; j++) {
                assets[keys[j]].tab = settings.assets[i].name
                assets[keys[j]].version = 0
                assets[keys[j]].panning = []
                assets[keys[j]].location = assets[keys[j]].location.replace(/\\/g, '/')
                newAssets[`${settingsManager.settings.uuid}:${settingsManager.settings.numAssets}`] = assets[keys[j]]
                oldAssets[settings.assets[i].name][keys[j]] = settingsManager.settings.numAssets
                settingsManager.setNumAssets(parseInt(settingsManager.settings.numAssets, 10) + 1)
            }
        }

        // Update asset references in puppets
        const updateAsset = asset => {
            if (asset.children) {
                asset.children.forEach(updateAsset)
            } else {
                asset.id = `${settingsManager.settings.uuid}:${oldAssets[asset.tab][asset.hash]}`
                delete asset.tab
                delete asset.hash
            }
        }
        Object.values(characters).forEach(character => updateAsset(character.layers))
        return { assets: newAssets, folders }
    } else {
        const assets = fs.readJsonSync(path.join(assetsPath, 'assets.json'))
        const folders = settings.folders || (settings.folders = [])

        // Cross compatibility - windows will handle UNIX-style paths, but not vice versa
        Object.keys(assets).forEach(key => {
            let asset = assets[key]
            asset.location = asset.location.replace(/\\/g, '/')
            if (key.split(':')[0] == settingsManager.settings.uuid &&
                parseInt(key.split(':')[1], 10) >= settingsManager.settings.numAssets)
                settingsManager.setNumAssets(parseInt(key.split(':')[1]) + 1, 10)
            if (!asset.version) {
                asset.version =  0
                asset.panning = []
            }
            
            if (!folders.includes(asset.tab))
                folders.push(asset.tab)
        })

        Object.values(assets).forEach(asset => {
            if (asset.type === 'bundle')
                asset.conflicts = getConflicts({ assets }, asset.layers)
        })
        return { assets, folders }
    }
}

// Given an asset bundle, finds and returns an object with "true" values for any of the conflicting keys (head, emote, emoteLayer) within its layers,
// plus an array of used emotes
export function getConflicts(assets, layers) {
    function handleLayer(field) {
        return layer => {
            if (field in layer)
                return true
        }
    }

    const emotes = []
    function findEmotes(layer) {
        if (layer.emote && !emotes.includes(layer.emote))
            emotes.push(layer.emote)
    }
    Puppet.handleLayer(assets, layers, findEmotes)
    return {
        head: !!Puppet.handleLayer(assets, layers, handleLayer('head')),
        emoteLayer: !!Puppet.handleLayer(assets, layers, handleLayer('emoteLayer')),
        emote: !!emotes.length,
        emotes
    }
}

function close(state) {
    menu.updateMenu(false)
    return util.updateObject(state, { project: null })
}

function loadProject(state, action) {
    const filepath = action.project.replace(/\\/g, '/')
    if (!fs.existsSync(filepath)) {
        return close(state)
    }

    // Copies project defaults
    const settings = Object.assign({}, DEFAULTS.settings)
    // Loads project settings
    const playerSettings = fs.readJsonSync(filepath)
    Object.assign(settings, playerSettings)

    // Register global shortcuts
    window.require('electron').ipcRenderer.send('global', 
        [], Object.keys(settings.shortcuts).map(k => ({
            accel: settings.shortcuts[k],
            shortcut: k
        })))

    // Confirm loading project if mismatched versions
    let compare = playerSettings.clientVersion ?
        semver.compare(playerSettings.clientVersion, remote.app.getVersion()) :
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

        // If the player cancels, then don't change state
        if (remote.dialog.showMessageBox(options) === 0) return close(state)
    }

    settingsManager.settings.openProject = filepath
    settingsManager.save()

    const assetsPath = path.join(filepath, settings.assetsPath || '../assets')
    let {characters, characterThumbnails, numCharacters, converted} = loadCharacters(settings, path.join(filepath, settings.charactersPath))
    const {assets} = loadAssets(settings, assetsPath, characters)
    delete settings.assets

    // Update old settings to new environments
    if ('greenScreen' in settings) {
        // If they had a custom setup, create a environment to store it
        if (settings.greenScreen != '#00FF00' ||
            settings.numCharacters != 5 ||
            settings.puppetScale != 1) {
            const environment = {
                'id': ++numCharacters, 
                'name': 'Legacy',
                'color': settings.greenScreen == '#00FF00' ? DEFAULT_ENVIRONMENT.color : settings.greenScreen,
                'width': 1920,
                'height': 1080,
                'layers': {
                    children: [
                        {
                            id: 'CHARACTER_PLACEHOLDER',
                            leaf: 'true',
                            name: 'PUPPETS',
                            rotation: 0,
                            scaleX: 1,
                            scaleY: 1,
                            x: 0,
                            y: 0
                        }
                    ]
                },
                'numCharacters': settings.numCharacters,
                'puppetScale': settings.puppetScale,
                'shortcut': null
            }
            settings.environment = settings.environments.length
            settings.environments.push(environment)
            ipcRenderer.send('background', 'generate thumbnails',
                `${path.join(filepath, settings.charactersPath, '..',
                    'thumbnails', `${environment.id}`)}`.replace(/\\/g, '/'),
                environment, 'environment', environment.id)
        }

        // Delete old values we don't need anymore
        delete settings.greenScreen
        delete settings.numCharacters
        delete settings.puppetScale
    }

    let dirtyCharacters = []

    // Remove any assets that don't exist in this project
    const filterAssets = c => layer => {
        if (layer.children) {
            layer.children = layer.children.filter(filterAssets(c))
        }
        // TODO add warning about remove asset to console
        if (!('id' in layer) || layer.id in assets)
            return true
        else {
            if (!dirtyCharacters.includes(c))
                dirtyCharacters.push(c)
            return false
        }
    }
    Object.keys(characters).forEach(c =>
        characters[c].layers.children = characters[c].layers.children.filter(filterAssets(c)))

    // Update assets if converted to new layers system
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

    menu.updateMenu(true)

    return {
        project: filepath,
        settings,
        characters,
        dirtyCharacters,
        characterThumbnails,
        assets,
        numCharacters,
        // TODO way to store a redux state and compare against it later?
        oldSettings: JSON.stringify(settings),
        oldCharacters: JSON.stringify(characters),
        charactersPath: path.join(filepath, settings.charactersPath),
        assetsPath: `file:///${path.join(filepath, settings.assetsPath)}`,
        defaultEnvironment: DEFAULT_ENVIRONMENT
    }
}

export default {
    'LOAD_PROJECT': loadProject,
    'CLOSE_PROJECT': close
}
