import util from '../../util.js'

// taken from https://wiki.urealms.com/wiki/List_of_Minor_Characters - Updated 2018-01-08
import names from '../../../data/names.json'

// Action Types
const SET = 'project/settings/nickname/SET'

// Utility Functions
function getRandomName() {
    return names[Math.floor(Math.random() * names.length)]
}

// Action Creators
export function randomize() {
    return { type: SET, nickname: getRandomName() }
}

export function set(nickname) {
    return { type: SET, nickname }
}

// Reducers
export default util.createReducer(getRandomName(), {
    [SET]: (state, action) => action.nickname
})
