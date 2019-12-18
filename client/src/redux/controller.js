import util from './util.js'
import { combineReducers } from 'redux'
import {
    setEmote as setActorEmote,
    moveLeft as moveActorLeft,
    moveRight as moveActorRight,
    jiggle as jiggleActor,
    changePuppet as changeActorPuppet,
    setBabbling as setActorBabbling
} from './actors'
import { emit } from './networking'
import { setEnvironment, setDefaultEnvironment } from './environment'

const ipcRenderer = window.require('electron').ipcRenderer

// Action Types
const SET_ACTORS = 'controller/SET_ACTORS'
const SET_BABBLING = 'controller/SET_BABBLING'

// Action Creators
export function setActors(actors = []) {
    return { type: SET_ACTORS, actors }
}

export function setEmote(emote) {
    return (dispatch, getState) => {
        getState().controller.actors.forEach(id => {
            dispatch(setActorEmote(id, emote))
            dispatch(emit('set emote', id, emote))
        })
    }
}

export function moveLeft() {
    return (dispatch, getState) => {
        getState().controller.actors.forEach(id => {
            dispatch(moveActorLeft(id))
            dispatch(emit('move left', id))
        })
    }
}

export function moveRight() {
    return (dispatch, getState) => {
        getState().controller.actors.forEach(id => {
            dispatch(moveActorRight(id))
            dispatch(emit('move right', id))
        })
    }
}

export function jiggle() {
    return (dispatch, getState) => {
        getState().controller.actors.forEach(id => {
            dispatch(jiggleActor(id))
            dispatch(emit('jiggle', id))
        })
    }
}

export function changePuppet(index, skipHotbar = false) {
    return (dispatch, getState) => {
        const state = getState()
        const puppetId = skipHotbar ? index : state.project.settings.hotbar[index]
        const character = state.project.characters[puppetId]
        if (character)
            state.controller.actors.forEach(id => {
                dispatch(changeActorPuppet(id, puppetId, character))
                dispatch(emit('set puppet', id, character))
                if (state.networking.connectedRoom)
                    ipcRenderer.send('background', 'get thumbnail URI', id, character)
            })
    }
}

export function changeEnvironment(index, skipHotbar = false) {
    return (dispatch, getState) => {
        const state = getState()
        const env = skipHotbar ? index : state.project.settings.environmentHotbar[index]
        if (env === -1) {
            dispatch(setDefaultEnvironment())
            return
        }
        const environment = state.project.environments[env]
        if (environment)
            dispatch(setEnvironment(state.self, env, environment))
    }
}

export function setBabbling(babbling = false) {
    return (dispatch, getState) => {
        getState().controller.actors.forEach(id => {
            dispatch(setActorBabbling(id, babbling))
            dispatch(emit(`${babbling ? 'start' : 'stop'} babbling`, id))
        })
        dispatch({ type: SET_BABBLING, babbling })
    }
}

// Reducers
const actorsReducer = util.createReducer([], {
    [SET_ACTORS]: (state, action) => action.actors
})

const babblingReducer = util.createReducer(false, {
    [SET_BABBLING]: (state, action) => action.babbling
})

export default combineReducers({
    actors: actorsReducer,
    babbling: babblingReducer
})
