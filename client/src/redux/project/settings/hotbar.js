import util from '../../util.js'
import { getActor } from '../../actors'
import { changePuppet } from '../../actors'
import { emit } from '../../networking'

// Utility Functions
function updateActors(dispatch, state, actor, slotIndex, newValue) {
    const prevHotbar = state.project.settings.hotbar
    const characters = state.project.characters

    // if we didn't change this slot, we don't need to change the actor
    if (prevHotbar[slotIndex] === newValue)
        return

    const matches = prevHotbar.filter(puppet => puppet == actor.puppetId)
    // If its a non-one amount, we don't need to change the actor
    if (matches.length !== 1 || prevHotbar.indexOf(matches[0]) !== slotIndex)
        return

    // If we changed the one hotbar slot this actor matches,
    // change the actor to the new puppet
    dispatch(changePuppet(actor.id, newValue, characters[newValue]))
    dispatch(emit('set puppet', actor.id, characters[newValue]))
}

// Action Types
const SET_ALL = 'project/settings/hotbars/SET_ALL'
const SET = 'project/settings/hotbars/SET'

// Action Creators
export function setHotbar(hotbar) {
    return (dispatch, getState) => {
        hotbar = hotbar || [1,0,0,0,0,0,0,0,0]
        const state = getState()
        const controller = state.controller

        dispatch({ type: SET_ALL, hotbar })
        
        // Change any actors we're controlling that'd be affected
        controller.actors.forEach(id => {
            const actor = getActor(state, id)
            hotbar.forEach((newValue, index) =>
                updateActors(dispatch, state, actor, index, newValue))
        })
    }
}

export function setSlot(slot, puppet) {
    return (dispatch, getState) => {
        const state = getState()
        const controller = state.controller

        dispatch({ type: SET, index: slot, id: puppet })

        // If we're not clearing the slot, we may want to change our puppet
        if (puppet !== 0)
            controller.actors.forEach(id => {
                const actor = getActor(state, id)
                updateActors(dispatch, state, actor, slot, puppet)
            })
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
