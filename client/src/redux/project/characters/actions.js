// We split up certain modules into reducers and actions due to some issues
//  with circular dependencies when creating the reducers

import util from '../../util.js'
import { warn } from '../../status'
import { close } from '../../inspector'
import { close as closeEditor } from '../../editor/editor'
import { setNumCharacters } from '../project'
import { updateThumbnail, removeThumbnail } from '../characterThumbnails'
import {
    addCharacter as addCharacterSettings,
    removeCharacter
} from '../settings/characters'
import { getActor, changePuppet } from '../../actors'
import { SET, ADD, REMOVE, EDIT } from './reducers'

const path = window.require('path')
const fs = window.require('fs-extra')
const { remote, ipcRenderer } = window.require('electron')
const settingsManager = remote.require('./main-process/settings')

//  Utility Functions
export function copyThumbnails(dispatch, type, thumbnail, newId) {
    if (thumbnail == null) return

    thumbnail = thumbnail.slice(8)
    const folder = thumbnail.split('/').slice(0, -1).join('/')
    fs.removeSync(`${folder}/new-${newId}.png`)
    fs.removeSync(`${folder}/new-${newId}`)
    if (fs.existsSync(thumbnail))
        fs.copySync(thumbnail, `${folder}/new-${newId}.png`)
    if (fs.existsSync(thumbnail.slice(0, -4)))
        fs.copySync(thumbnail.slice(0, -4), `${folder}/new-${newId}`)

    dispatch(updateThumbnail(newId, type, `${folder}/new-${newId}`))
}

// Action Creators
export function addCharacter(id, character) {
    return (dispatch, getState) => {
        const project = getState().project

        if (id > project.numCharacters)
            dispatch(setNumCharacters(id))

        dispatch({ type: ADD, id, character })
        const thumbnail =
            path.join(project.charactersPath, '..', 'thumbnails', `new-${id}`)
        dispatch(updateThumbnail(id, 'puppet', thumbnail))
        dispatch(addCharacterSettings(id))
    }
}

export function newCharacter() {
    return (dispatch, getState) => {
        const state = getState()
        const id = state.project.numCharacters + 1
        const character = util.updateObject(state.defaults.character)
        character.creator = character.oc = settingsManager.settings.uuid
        character.creatorNick = character.ocNick = state.project.settings.nickname

        const thumbnailPath =
            path.join(state.project.charactersPath, '..', 'thumbnails')
        fs.removeSync(`${path.join(thumbnailPath, `new-${id}.png`)}`)
        fs.removeSync(`${path.join(thumbnailPath, `new-${id}`)}`)

        dispatch(addCharacter(id, character))
        dispatch(updateThumbnail(id, 'puppet', `${path.join(thumbnailPath, `new-${id}`)}`))
    }
}

export function duplicateCharacter(id) {
    return (dispatch, getState) => {
        const state = getState()
        const newId = state.project.numCharacters + 1

        if (!(id in state.project.characters)) {
            warn("Cannot duplicate character because character doesn't exist")
            return
        }

        const character = util.updateObject(state.project.characters[id], {
            creator: settingsManager.settings.uuid,
            creatorNick: state.project.settings.nickname,
            name: `${state.project.characters[id].name} (copy)`
        })

        copyThumbnails(dispatch, 'puppet', state.project.characterThumbnails[id], newId)

        dispatch(addCharacter(newId, character))
    }
}

export function deleteCharacter(id) {
    return (dispatch, getState) => {
        const state = getState()
        if (!(id in state.project.characters)) {
            warn("Cannot delete character because character doesn't exist")
            return
        }
        if (state.controller.actors.some(actor =>
            getActor(state, actor).puppetId === id)) {
            warn("You can't delete your active puppet!")
            return
        }

        dispatch({ type: REMOVE, id })
        dispatch(removeThumbnail(id))
        dispatch(removeCharacter(id))
        if (state.inspector.targetType === 'puppet' &&
            state.inspector.target === id)
            dispatch(close())
        if (state.editor.present.type === 'puppet' &&
            state.editor.present.id === id)
            dispatch(closeEditor())
    }
}

export function changeCharacter(id, character) {
    return (dispatch, getState) => {
        const { project, controller, actors } = getState()
        if (!(id in project.characters)) {
            warn("Cannot modify character because character doesn't exist")
            return
        }

        const thumbnail = project.characterThumbnails[id].slice(8)
        const folder = thumbnail.split('/').slice(0, -1).join('/')
        ipcRenderer.send('background', 'generate thumbnails',
            `${folder}/new-${id}`, character, 'puppet', id)

        dispatch({ type: EDIT, id, character })

        // Update any of our actors currently using this puppet
        character = util.updateObject(project.characters[id], character)
        actors.filter(actor => controller.actors.includes(actor.id))
            .filter(actor => actor.puppetId === id)
            .forEach(actor => dispatch(changePuppet(actor.id, id, character)))
    }
}
