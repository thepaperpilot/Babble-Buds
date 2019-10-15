import util from '../../util.js'

// Action Types
const SET = 'project/settings/characters/SET'
const ADD = 'project/settings/characters/ADD'
const REMOVE = 'project/settings/characters/REMOVE'

// Action Creators
export function setCharacters(characters) {
    return { type: SET, characters }
}

export function addCharacter(id) {
    return { type: ADD, character: {
        id,
        location: `${id}.json`
    } }
}

export function removeCharacter(id) {
    return { type: REMOVE, id }
}

// Reducers
export default util.createReducer([
    {
        'id': 1,
        'location': '1.json'
    }
], {
    [SET]: (state, action) => action.characters,
    [ADD]: (state, action) => [...state, action.character],
    [REMOVE]: (state, action) => {
        const index = state.findIndex(c => c.id === action.id)
        if (index > -1)
            return [...state.slice(0, index), ...state.slice(index + 1)]
        return state
    }
})
