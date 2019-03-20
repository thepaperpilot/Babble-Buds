import { DEFAULT_CHARACTER } from './defaults'
import assets from './assets'

const path = window.require('path')
const fs = window.require('fs-extra')
const util = require('./../util')

const remote = window.require('electron').remote
const settingsManager = remote.require('./main-process/settings')

function changePuppet(state, action) {
    const character = util.updateObject(state.characters[action.puppet], {
        [action.key]: action.value
    })
    const characters = util.updateObject( state.characters, {
        [action.puppet]: character
    })
    return util.updateObject(state, { characters })
}

function duplicatePuppet(state, action) {
    const character = util.updateObject(state.characters[action.puppet])
    const id = state.numCharacters + 1
    const thumbnail = state.characterThumbnails[action.puppet]
    const characterThumbnail = `file:///${thumbnail.split('/').slice(0, -1).join('/')}/new-${id}.png`

    fs.removeSync(`${thumbnail.slice(8).split('/').slice(0, -1).join('/')}/new-${id}`)
    if (fs.existsSync(thumbnail.slice(8)))
        fs.copySync(thumbnail.slice(8), `${thumbnail.slice(8).split('/').slice(0, -1).join('/')}/new-${id}.png`)
    if (fs.existsSync(thumbnail.slice(8, -4)))
        fs.copySync(thumbnail.slice(8, -4), `${thumbnail.slice(8).split('/').slice(0, -1).join('/')}/new-${id}`)

    character.name = `${character.name} (Copy)`
    character.id = id
    character.location = `${id}.json`
    
    const characterSetting = {
        name: character.name,
        location: character.location,
        id: character.id
    }
    const characterSettings = state.settings.characters.slice()
    characterSettings.push(characterSetting)

    const characters = util.updateObject(state.characters, {
        [id]: character
    })
    const characterThumbnails = util.updateObject(state.characterThumbnails, {
        [id]: characterThumbnail
    })
    const numCharacters = state.numCharacters + 1
    const settings = util.updateObject(state.settings, { characters: characterSettings })
    
    return util.updateObject(state, { characters, characterThumbnails, numCharacters, settings })
}

function deletePuppet(state, action) {
    const characters = util.updateObject(state.characters)
    delete characters[action.puppet]
    const characterThumbnails = util.updateObject(state.characterThumbnails)
    delete characterThumbnails[action.puppet]
    return util.updateObject(state, { characters, characterThumbnails })
}

function newPuppet(state) {
    const character = JSON.parse(JSON.stringify(DEFAULT_CHARACTER))
    const id = state.numCharacters + 1
    const characterThumbnail =
        `file:///${path.join(state.settings.charactersPath, '..', 'thumbnails',
            `new-${id}.png`)}`.replace(/\\/g, '/')

    fs.removeSync(`${path.join(state.settings.charactersPath, '..', 'thumbnails',
        `new-${id}.png`)}`)
    fs.removeSync(`${path.join(state.settings.charactersPath, '..', 'thumbnails',
        `new-${id}`)}`)

    character.creator = settingsManager.settings.uuid
    character.creatorNick = state.settings.nickname
    character.oc = settingsManager.settings.uuid
    character.ocNick = state.settings.nickname

    const characterSetting = {
        name: character.name,
        location: `${id}.json`,
        id
    }

    const characterSettings = state.settings.characters.slice()
    characterSettings.push(characterSetting)
    const characters = util.updateObject(state.characters, { [id]: character })
    const characterThumbnails = util.updateObject(state.characterThumbnails, {
        [id]: characterThumbnail
    })
    const numCharacters = id
    const settings = util.updateObject(state.settings, {
        characters: characterSettings
    })

    return util.updateObject(state, {
        characters,
        characterThumbnails,
        numCharacters,
        settings
    })
}

function addPuppets(state, action) {
    let numCharacters = state.numCharacters
    const puppets = {}
    const puppetThumbnails = {}
    const puppetSettings = state.settings.characters.slice()

    Object.values(action.puppets).forEach(puppet => {
        if (numCharacters < puppet.id) numCharacters = puppet.id
        puppets[puppet.id] = puppet
        puppetThumbnails[puppet.id] =
            `file:///${path.join(state.project, state.settings.charactersPath,
                '..', 'thumbnails', `new-${puppet.id}.png`)}`.replace(/\\/g, '/')
        puppetSettings.push({
            id: puppet.id,
            name: puppet.name,
            location: `${puppet.id}.json`
        })
    })
    
    const characters = util.updateObject(state.characters, puppets)
    const characterThumbnails = util.updateObject(state.characterThumbnails,
        puppetThumbnails)
    const settings = util.updateObject(state.settings, { characters: puppetSettings })

    return assets['ADD_ASSETS'](util.updateObject(state, {
        settings,
        characters,
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
    'CHANGE_PUPPET': changePuppet,
    'DUPLICATE_PUPPET': duplicatePuppet,
    'DELETE_PUPPET': deletePuppet,
    'NEW_PUPPET': newPuppet,
    'ADD_PUPPETS': addPuppets,
    'UPDATE_PUPPET_THUMBNAILS': updateThumbnails
}
