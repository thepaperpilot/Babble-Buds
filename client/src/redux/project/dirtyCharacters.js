import util from '../util.js'

// Action Types
const ADD = 'project/dirtyCharacters/ADD'
const CLEAR = 'project/dirtyCharacters/CLEAR'

// Action Creators
export function addCharacters(characters) {
    return { type: ADD, characters }
}

export function clearCharacters() {
    return { type: CLEAR }
}

// Reducers
export default util.createReducer([], {
    [ADD]: (state, action) => [...state, ...action.characters],
    [CLEAR]: () => []
})
