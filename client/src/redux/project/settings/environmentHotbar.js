import util from '../../util.js'
import { setEnvironment } from '../../environment'

// Utility Functions
function updateEnvironment(dispatch, state, env, slotIndex) {
    const prevHotbar = state.project.settings.environmentHotbar
    const environment = state.project.environments[env]

    // if we didn't change this slot, we don't need to change the environment
    if (prevHotbar[slotIndex] === env)
        return

    const matches = prevHotbar.filter(e => e === prevHotbar[slotIndex])
    // If its a non-one amount, we don't need to change the environment
    if (matches.length !== 1)
        return

    if (state.environment.setter !== state.self ||
        state.environment.environmentId !== prevHotbar[slotIndex])
        return

    // If we changed the one hotbar slot this environment matches,
    // change the environment to the new one selected
    dispatch(setEnvironment(state.self, env, environment))
}

// Action Types
const SET_ALL = 'project/settings/environmentHotbar/SET_ALL'
const SET = 'project/settings/environmentHotbar/SET'

// Action Creators
export function setHotbar(hotbar) {
    return (dispatch, getState) => {
        hotbar = hotbar || [1,0,0,0,0,0,0,0,0]
        const state = getState()
        
        hotbar.forEach((newValue, index) =>
            updateEnvironment(dispatch, state, newValue, index))

        dispatch({ type: SET_ALL, hotbar })
    }
}

export function setSlot(slot, env) {
    return (dispatch, getState) => {
        const state = getState()

        // If we're not clearing the slot, we may need to change our environment
        if (env !== 0)
            updateEnvironment(dispatch, state, env, slot)

        dispatch({ type: SET, index: slot, id: env })
    }
}

// Reducers
export default util.createReducer([
    0,
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
