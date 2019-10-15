// We split up certain modules into reducers and actions due to some issues
//  with circular dependencies when creating the reducers

import util from '../../util.js'

// Action Types
export const SET = 'project/characters/SET'
export const ADD = 'project/characters/ADD'
export const REMOVE = 'project/characters/REMOVE'
export const EDIT = 'project/characters/EDIT'

// Action Creators
export function setCharacters(characters) {
    return { type: SET, characters }
}

// Reducers
export default util.createReducer([], {
    [SET]: (state, action) => action.characters,
    [ADD]: (state, action) => ({...state, [action.id]: action.character}),
    [REMOVE]: (state, action) => {
        const characters = util.updateObject(state)
        delete characters[action.id]
        return characters
    },
    [EDIT]: (state, action) => util.updateObject(state, {
        [action.id]: util.updateObject(state[action.id], action.character)
    })
})
