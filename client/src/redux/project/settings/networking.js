import { combineReducers } from 'redux'
import util from '../../util.js'

// Action Types
const SET_ROOM = 'project/settings/networking/SET_ROOM'
const SET_PASSWORD = 'project/settings/networking/SET_PASSWORD'
const SET_ASSET_PERMISSION = 'project/settings/networking/SET_ASSET_PERMISSION'
const SET_DEFAULT_PUPPET = 'project/settings/networking/SET_DEFAULT_PUPPET'

// Add Asset Permissions
export const ANYONE = 2
export const ADMINS_ONLY = 1
export const HOST_ONLY = 0

// Action Creators
export function setNetworking(networking) {
    return (dispatch, getState) => {
        const {
            roomName: name, roomPassword: password, addAssetPermission, defaultPuppet
        } = (networking || {})
        dispatch({ type: SET_ROOM, name: name || 'lobby' })
        dispatch({ type: SET_PASSWORD, password: password || '' })
        dispatch({ type: SET_ASSET_PERMISSION, permission: addAssetPermission || HOST_ONLY })
        dispatch({ type: SET_DEFAULT_PUPPET, puppet: defaultPuppet || Object.keys(getState().project.characters)[0] || "1" })
    }
}

export function setRoomName(name) {
    return { type: SET_ROOM, name }
}

export function setRoomPassword(password) {
    return { type: SET_PASSWORD, password }
}

export function setAddAssetPermission(permission) {
    return { type: SET_ASSET_PERMISSION, permission }
}

export function setDefaultPuppet(puppet) {
    return { type: SET_DEFAULT_PUPPET, puppet }
}

// Reducers
const roomNameReducer = util.createReducer('lobby', {
    [SET_ROOM]: (state, action) => action.name
})

const roomPasswordReducer = util.createReducer('', {
    [SET_PASSWORD]: (state, action) => action.password
})

const addAssetPermissionReducer = util.createReducer(HOST_ONLY, {
    [SET_ASSET_PERMISSION]: (state, action) => action.permission
})

const defaultPuppetReducer = util.createReducer("1", {
    [SET_DEFAULT_PUPPET]: (state, action) => action.puppet
})

export default combineReducers({
    roomName: roomNameReducer,
    roomPassword: roomPasswordReducer,
    addAssetPermission: addAssetPermissionReducer,
    defaultPuppet: defaultPuppetReducer
})
