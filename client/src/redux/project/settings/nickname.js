import util from '../../util.js'
import { emit } from '../../networking'

// taken from https://wiki.urealms.com/wiki/List_of_Minor_Characters - Updated 2018-01-08
import names from '../../../data/names.json'

// Action Types
const SET = 'project/settings/nickname/SET'

// Utility Functions
function getRandomName() {
    return names[Math.floor(Math.random() * names.length)]
}

// Action Creators
export function randomizeNickname() {
    return (dispatch, getState) => {
        const nickname = getRandomName()
        dispatch({ type: SET, nickname })
        dispatch(emit('change nickname', nickname))
    }
}

export function setNickname(nickname) {
    return (dispatch, getState) => {
        nickname = nickname || getRandomName()
        dispatch({ type: SET, nickname })
        dispatch(emit('change nickname', nickname))
    }
}

// Reducers
export default util.createReducer(getRandomName(), {
    [SET]: (state, action) => action.nickname
})
