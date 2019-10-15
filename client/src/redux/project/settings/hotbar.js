import util from '../../util.js'
import { getActor } from '../../actors'
import { changePuppet } from '../../controller'

// Action Types
const SET_ALL = 'project/settings/hotbars/SET_ALL'
const SET = 'project/settings/hotbars/SET'

// Action Creators
export function setHotbar(hotbar) {
    return (dispatch, getState) => {
        const state = getState()
        const controller = state.controller
        const old = state.project.settings.hotbar
        const characters = state.project.characters
        
        // Change any actors we're controlling that'd be affected
        controller.actors.forEach(id => {
            const actor = getActor(state, id)
            // Find any hotbar slots set to the puppet this actor currently is
            const matches = old.filter(puppet => actor.puppetId)
            // If its a non-one amount, we don't need to change the actor
            if (matches.length !== 1)
                return
            // if we didn't change this slot, we don't need to change the actor
            const index = old.findIndex(puppet => actor.puppetId)
            if (old[index] === hotbar[index])
                return

            // If we changed the one hotbar slot this actor matches,
            // change the actor to the new puppet
            dispatch(changePuppet(id, hotbar[index], characters[hotbar[index]]))
        })

        dispatch({ type: SET_ALL, hotbar })
    }
}

export function setSlot(slot, puppet) {
    return (dispatch, getState) => {
        const state = getState()
        const controller = state.controller
        const old = state.project.settings.hotbar
        const characters = state.project.characters

        // If we're not clearing the slot, we may want to change our puppet
        if (puppet !== 0)
            controller.actors.forEach(id => {
                const actor = getActor(state, id)
                // Find any hotbar slots set to the puppet this actor currently is
                const matches = old.filter(puppet => actor.puppetId)
                // If its a non-one amount, we don't need to change the actor
                if (matches.length !== 1)
                    return
                // if we didn't change this slot, we don't need to change the actor
                if (old[slot] === puppet)
                    return

                // If we changed the one hotbar slot this actor matches,
                // change the actor to the new puppet
                dispatch(changePuppet(id, puppet, characters[puppet]))
            })

        dispatch({ type: SET, index: slot, id: puppet })
    }
}

// Reducers
export default util.createReducer([
    1,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0
], {
    [SET_ALL]: (state, action) => action.hotbar,
    [SET]: (state, action) => [...state.slice(0, action.index), action.id, ...state.slice(action.index + 1)]
})
