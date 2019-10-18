// We split up certain modules into reducers and actions due to some issues
//  with circular dependencies when creating the reducers

import util from '../../util.js'

// Action Types
export const SET = 'project/environments/SET'
export const ADD = 'project/environments/ADD'
export const REMOVE = 'project/environments/REMOVE'
export const EDIT = 'project/environments/EDIT'

// Action Creators
export function setEnvironments(environments) {
    return { type: SET, environments }
}

// Reducers
export default util.createReducer({}, {
    [SET]: (state, action) => action.environments,
    [ADD]: (state, action) => ({...state, [action.id]: action.environment}),
    [REMOVE]: (state, action) => {
        const environments = util.updateObject(state)
        delete environments[action.id]
        return environments
    },
    [EDIT]: (state, action) => util.updateObject(state, {
        [action.id]: util.updateObject(state[action.id], action.environment)
    })
})
