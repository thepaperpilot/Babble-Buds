import { getConflicts } from './assets/reducers'
import { updatePaths } from '../editor/layers'

const fs = window.require('fs-extra')
const path = window.require('path')
const remote = window.require('electron').remote
const settingsManager = remote.require('./main-process/settings')

// Loads and automatically converts a project's characters
export function loadCharacters(settings, charactersPath, defaults) {
    const characters = {}
    const environments = {}
    const characterThumbnails = {}
    let converted = false

    let numCharacters = 0
    for (let i = 0; i < settings.characters.length; i++) {
        const loadedCharacter =
            fs.readJsonSync(path.join(charactersPath, settings.characters[i].location))
        const id = settings.characters[i].id
        const character = characters[id] =
            Object.assign({}, defaults.character, loadedCharacter)

        character.creator = settingsManager.settings.uuid
        character.creatorNick = settings.nickname
        if (character.oc == null) {
            character.oc = settingsManager.settings.uuid
            character.ocNick = settings.nickname
        }
        characterThumbnails[id] = `file:///${path.join(charactersPath, '..', 'thumbnails',
            `${id}.png`)}`.replace(/\\/g, '/')

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

        // Update layer paths
        updatePaths(character.layers)

        // If their name is in project settings, move it over to the character
        if ('name' in settings.characters[i]) {
            character.name = settings.characters[i].name
            delete settings.characters[i].name
        }

        for (let j = 0; j < emotes.length; j++)
            if (fs.existsSync(path.join(charactersPath, '..', 'thumbnails', `${id}`, `${emotes[j]}.png`)))
                fs.moveSync(path.join(charactersPath, '..', 'thumbnails', `${id}`, `${emotes[j]}.png`),
                    path.join(charactersPath, '..', 'thumbnails', `${id}`, `${j}.png`))
    }

    for (let i = 0; i < settings.environments.length; i++) {
        // TODO if we ever need to add backwards-compatibility checks for environments,
        // it may be better to extract out a processCharacter function and feed environments
        // through it as well
        const loadedEnvironment =
            fs.readJsonSync(path.join(charactersPath, settings.environments[i].location))
        const id = settings.environment[i].id
        environments[id] =
            Object.assign({}, defaults.environment, loadedEnvironment)

        characterThumbnails[id] = `file:///${path.join(charactersPath, '..', 'thumbnails',
            `${id}.png`)}`.replace(/\\/g, '/')

        if (id > numCharacters)
            numCharacters = id
    }

    return {characters, environments, characterThumbnails, numCharacters, converted}
}

// Loads and automatically converts a project's assets
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
