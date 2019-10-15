import util from './util.js'
import { Puppet } from 'babble.js'
import { warn } from './status'

// Action Types
const ADD = 'actors/ADD'
const REMOVE = 'actors/REMOVE'
const CHANGE = 'actors/CHANGE'

// Utility Functions
export function getActor(state, id) {
    return state.actors.find(actor => actor.id === id)
}

// Action Creators
export function addActor(id, puppetId, character) {
    return (dispatch, getState) => {
        const assets = getState().project.assets
        
        // Find the first emote the puppet has
        let emote = 0
        Puppet.handleLayer(assets, character.layers, layer => {
            if ('emote' in layer) {
                emote = layer.emote
                return true
            }
            return false
        })

        const actor = {
            id,
            puppetId,
            character,
            emote,
            babbling: false,
            jiggle: 0,
            position: 0,
            facingLeft: false
        }
        
        dispatch({ type: ADD, actor })
    }
}

export function removeActor(id) {
    return (dispatch, getState) => {
        const actor = getActor(getState(), id)
        if (actor == null) {
            dispatch(warn("Unable to remove actor from stage because actor doesn't exist"))
            return
        }

        dispatch({ type: REMOVE, id })
    }
}

export function changePuppet(id, puppetId, character) {
    return (dispatch, getState) => {
        const act = getActor(getState(), id)
        if (act == null) {
            dispatch(warn("Unable to change actor's puppet because actor doesn't exist"))
            return
        }

        const actor = { puppetId, character }
        dispatch({ type: CHANGE, id, actor })
    }
}

export function setEmote(id, emote) {
    return (dispatch, getState) => {
        const act = getActor(getState(), id)
        if (act == null) {
            dispatch(warn("Unable to change actor's emote because actor doesn't exist"))
            return
        }

        const actor = { emote }
        dispatch({ type: CHANGE, id, actor })
    }
}

export function moveLeft(id) {
    return (dispatch, getState) => {
        const state = getState()
        const act = getActor(state, id)
        if (act == null) {
            dispatch(warn("Unable to move actor because actor doesn't exist"))
            return
        }

        let actor = { facingLeft: true }
        if (act.facingLeft || act.position === 0 || act.position == state.environment.numCharacters + 1)
            actor.position = act.position - 1
        dispatch({ type: CHANGE, id, actor })
    }
}

export function moveRight(id) {
    return (dispatch, getState) => {
        const state = getState()
        const act = getActor(state, id)
        if (act == null) {
            dispatch(warn("Unable to move actor because actor doesn't exist"))
            return
        }

        let actor = { facingLeft: false }
        if (!act.facingLeft || act.position === 0 || act.position == state.environment.numCharacters + 1)
            actor.position = act.position + 1
        dispatch({ type: CHANGE, id, actor })
    }
}

export function jiggle(id) {
    return (dispatch, getState) => {
        const act = getActor(getState(), id)
        if (act == null) {
            dispatch(warn("Unable to jiggle actor because actor doesn't exist"))
            return
        }

        const actor = { jiggle: act.jiggle + 1 }
        dispatch({ type: CHANGE, id, actor })
    }
}

export function setBabbling(id, babbling = false) {
    return (dispatch, getState) => {
        const act = getActor(getState(), id)
        if (act == null) {
            dispatch(warn("Unable to make actor babble because actor doesn't exist"))
            return
        }

        const actor = { babbling }
        dispatch({ type: CHANGE, id, actor })
    }
}

// Reducers
export default util.createReducer([], {
    [ADD]: (state, action) => [...state, action.actor],
    [REMOVE]: (state, action) => {
        const index = state.findIndex(({id}) => id === action.id)
        return [...state.slice(0, index), ...state.slice(index + 1)]
    },
    [CHANGE]: (state, action) => {
        const actors = state.slice()
        const index = state.findIndex(({id}) => id === action.id)
        actors[index] = util.updateObject(actors[index], action.actor)
        return actors
    }
})