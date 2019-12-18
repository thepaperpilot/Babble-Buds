import util from './util.js'
import { emit } from './networking'
import { warn } from './status'

// Action Types
const SET = 'environment/SET'

// Action Creators
export function setEnvironment(setter, environmentId, environment, ignoreNetworking = false) {
    return (dispatch, getState) => {
        const state = getState()
        if (!ignoreNetworking && state.networking.connectedRoom &&
            !state.networking.connectedUsers.find(user => user.id === state.networking.self).isAdmin) {
            dispatch(warn('You don\'t have permission to change the environment!'))
            return
        }

        dispatch({
            type: SET,
            environment: {
                ...environment,
                setter,
                environmentId
            }
        })
        dispatch(emit('set environment', environment))
    }
}

export function setDefaultEnvironment() {
    return (dispatch, getState) => {
        const state = getState()
        dispatch(setEnvironment(state.self, -1, state.defaults.environment))
    }
}

// Reducers
export default util.createReducer({}, {
    [SET]: (state, action) => action.environment
})
