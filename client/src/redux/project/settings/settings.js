import { combineReducers } from 'redux'
import util from '../../util.js'
import characters, { setCharacters } from './characters'
import environments, { setEnvironments } from './environments'
import hotbar, { setHotbar } from './hotbar'
import networking, { setNetworking } from './networking'
import nickname, { setNickname } from './nickname'
import shortcuts, { setShortcuts } from './shortcuts'

const remote = window.require('electron').remote

// Action Types
const SET_ALWAYS_ON_TOP = 'project/settings/SET_ALWAYS_ON_TOP'
const SET_CHARACTERS_PATH = 'project/settings/SET_CHARACTERS_PATH'
const SET_ASSETS_PATH = 'project/settings/SET_ASSETS_PATH'

// Action Creators
export function setSettings(settings) {
    return (dispatch, getState) => {
        const {
            alwaysOnTop,
            charactersPath,
            assetsPath,
            characters,
            environments,
            hotbar,
            networking,
            nickname,
            shortcuts
        } = settings

        dispatch({ type: SET_ALWAYS_ON_TOP, alwaysOnTop })
        dispatch({ type: SET_CHARACTERS_PATH, charactersPath })
        dispatch({ type: SET_ASSETS_PATH, assetsPath })
        dispatch(setCharacters(characters))
        dispatch(setEnvironments(environments))
        dispatch(setHotbar(hotbar))
        dispatch(setNetworking(networking))
        dispatch(setNickname(nickname))
        dispatch(setShortcuts(shortcuts))
    }
}

export function setAlwaysOnTop(alwaysOnTop) {
    return { type: SET_ALWAYS_ON_TOP, alwaysOnTop }
}

// Reducers
const clientVersionReducer = util.createReducer(remote.app.getVersion(), {})

const alwaysOnTopReducer = util.createReducer(false, {
    [SET_ALWAYS_ON_TOP]: (state, action) => action.alwaysOnTop
})

const charactersPathReducer = util.createReducer('../characters', {
    [SET_CHARACTERS_PATH]: (state, action) => action.charactersPath
})

const assetsPathReducer = util.createReducer('../assets', {
    [SET_ASSETS_PATH]: (state, action) => action.assetsPath
})

export default combineReducers({
    clientVersion: clientVersionReducer,
    alwaysOnTop: alwaysOnTopReducer,
    charactersPath: charactersPathReducer,
    assetsPath: assetsPathReducer,
    characters,
    environments,
    hotbar,
    networking,
    nickname,
    shortcuts
})
