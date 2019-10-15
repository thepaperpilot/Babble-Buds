import util from '../util.js'
import { warn } from '../status'
import { close } from '../inspector'
import { setNumCharacters } from './project'
import { updateThumbnail, removeThumbnail } from './characterThumbnails'
import { copyThumbnails } from './characters/actions'
import {
    addEnvironment as addEnvironmentSettings,
    removeEnvironment
} from './settings/environments'
import { setEnvironment, setDefaultEnvironment } from '../environment'

const path = window.require('path')
const fs = window.require('fs-extra')
const { remote, ipcRenderer } = window.require('electron')
const settingsManager = remote.require('./main-process/settings')

// Action Types
const SET = 'project/environments/SET'
const ADD = 'project/environments/ADD'
const REMOVE = 'project/environments/REMOVE'
const EDIT = 'project/environments/EDIT'

// Action Creators
export function setEnvironments(environments) {
    return { type: SET, environments }
}

export function addEnvironment(id, environment) {
    return (dispatch, getState) => {
        const project = getState().project

        if (id > project.numCharacters)
            dispatch(setNumCharacters(id))

        dispatch({ type: ADD, id, environment })
        const thumbnail =
            path.join(project.charactersPath, '..', 'thumbnails', `new-${id}`)
        dispatch(updateThumbnail(id, 'environment', thumbnail))
        dispatch(addEnvironmentSettings(id))
    }
}

export function newEnvironment() {
    return (dispatch, getState) => {
        const state = getState()
        const id = state.project.numCharacters + 1
        const environment = util.updateObject(state.defaults.environment)
        environment.name = "New Environment"
        environment.creator = environment.oc = settingsManager.settings.uuid
        environment.creatorNick = environment.ocNick = state.project.settings.nickname

        fs.removeSync(`${path.join(state.project.charactersPath, '..', 'thumbnails',
            `new-${id}.png`)}`)
        fs.removeSync(`${path.join(state.project.charactersPath, '..', 'thumbnails',
            `new-${id}`)}`)

        dispatch(addEnvironment(id, environment))
    }
}

export function duplicateEnvironment(id) {
    return (dispatch, getState) => {
        const state = getState()
        const newId = state.project.numCharacters + 1

        if (!(id in state.project.environments)) {
            warn("Cannot duplicate environment because environment doesn't exist")
            return
        }

        const environment = util.updateObject(state.project.environments[id], {
            creator: settingsManager.settings.uuid,
            creatorNick: state.project.settings.nickname,
            name: `${state.project.environments[id].name} (copy)`
        })

        copyThumbnails(dispatch, 'environment', state.project.characterThumbnails[id], newId)

        dispatch(addEnvironment(newId, environment))
    }
}

export function deleteEnvironment(id) {
    return (dispatch, getState) => {
        const state = getState()
        if (!(id in state.project.environments)) {
            warn("Cannot delete environment because environment doesn't exist")
            return
        }

        dispatch({ type: REMOVE, id })
        dispatch(removeThumbnail(id))
        dispatch(removeEnvironment(id))
        if (state.inspector.targetType === 'environment' &&
            state.inspector.target === id)
            dispatch(close())
        if (state.environment.setter === state.self &&
            state.environment.environmentId === id)
            dispatch(setDefaultEnvironment())
    }
}

export function changeEnvironment(id, environment) {
    return (dispatch, getState) => {
        const state = getState()
        const project = state.project
        if (!(id in project.environments)) {
            warn("Cannot modify environment because environment doesn't exist")
            return
        }

        const thumbnail = project.characterThumbnails[id]
        ipcRenderer.send('background', 'generate thumbnails',
            `${thumbnail.slice(8).split('/').slice(0, -1).join('/')}/new-${id}`,
            environment, 'environment', id)

        dispatch({ type: EDIT, id, environment })

        if (state.environment.setter == state.self &&
            state.environment.environmentId == id) {
            const newEnv =
                util.updateObject(project.environments[id], environment)
            dispatch(setEnvironment(state.self, id, newEnv))
        }
    }
}

// Reducers
export default util.createReducer([], {
    [SET]: (state, action) => action.environments,
    [ADD]: (state, action) => ({...state, [action.id]: action.environment}),
    [REMOVE]: (state, action) => {
        const environments = util.updateObject(state)
        delete environments[action.id]
        return environments
    },
    [EDIT]: (state, action) => util.updateObject(state, {
        [action.id]: util.updateObject(state[action.id], action.environment)
    })
})
