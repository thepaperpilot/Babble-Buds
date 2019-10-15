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

// Action Types
const SET_ACTORS = 'controller/SET_ACTORS'
const SET_BABBLING = 'controller/SET_BABBLING'

// Action Creators
export function setActors(actors) {
    return { type: SET_ACTORS, actors }
}

export function setEmote(emote) {
    return (dispatch, getState) => {
        getState().controller.actors.forEach(id => dispatch(setActorEmote(id, emote)))
    }
}

export function moveLeft() {
    return (dispatch, getState) => {
        getState().controller.actors.forEach(id => dispatch(moveActorLeft(id)))
    }
}

export function moveRight() {
    return (dispatch, getState) => {
        getState().controller.actors.forEach(id => dispatch(moveActorRight(id)))
    }
}

export function jiggle() {
    return (dispatch, getState) => {
        getState().controller.actors.forEach(id => dispatch(jiggleActor(id)))
    }
}

export function changePuppet(index, skipHotbar = false) {
    return (dispatch, getState) => {
        const state = getState()
        const puppetId = skipHotbar ? index : state.project.settings.hotbar[index]
        const character = state.project.characters[puppetId]
        if (character)
            state.controller.actors.forEach(id => dispatch(changeActorPuppet(id, puppetId, character)))
    }
}

export function setBabbling(babbling = false) {
    return (dispatch, getState) => {
        getState().controller.actors.forEach(id => dispatch(setActorBabbling(id, babbling)))
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
