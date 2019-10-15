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
        dispatch({ type: SET, environment: getState().defaults.environment })
    }
}

// Reducers
export default util.createReducer(null, {
    [SET]: (state, action) => action.environment
})
