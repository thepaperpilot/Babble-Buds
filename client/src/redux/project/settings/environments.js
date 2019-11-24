import util from '../../util.js'

// Action Types
const SET = 'project/settings/environments/SET'
const ADD = 'project/settings/environments/ADD'
const REMOVE = 'project/settings/environments/REMOVE'

// Action Creators
export function setEnvironments(environments) {
    return { type: SET, environments: environments || [] }
}

export function addEnvironment(id) {
    return { type: ADD, environment: {
        id,
        location: `${id}.json`
    } }
}

export function removeEnvironment(id) {
    return { type: REMOVE, id }
}

// Reducers
export default util.createReducer([], {
    [SET]: (state, action) => action.environments,
    [ADD]: (state, action) => [...state, action.environment],
    [REMOVE]: (state, action) => {
        const index = state.findIndex(c => c.id === action.id)
        if (index > -1)
            return [...state.slice(0, index), ...state.slice(index + 1)]
        return state
    }
})
