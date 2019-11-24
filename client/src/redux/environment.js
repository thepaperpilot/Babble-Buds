import util from './util.js'

// Action Types
const SET = 'environment/SET'

// Action Creators
export function setEnvironment(setter, environmentId, environment) {
    return {
        type: SET,
        environment: {
            ...environment,
            setter,
            environmentId
        }
    }
}

export function setDefaultEnvironment() {
    return (dispatch, getState) => {
        const state = getState()
        dispatch({
            type: SET,
            environment: {
                ...state.defaults.environment,
                setter: state.self,
                environmentId: -1
            }
        })
    }
}

// Reducers
export default util.createReducer({}, {
    [SET]: (state, action) => action.environment
})
