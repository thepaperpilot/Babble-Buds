import { combineReducers } from 'redux'
import util from '../../util.js'

// Action Types
const SET_ROOM = 'project/settings/networking/SET_ROOM'
const SET_PASSWORD = 'project/settings/networking/SET_PASSWORD'
const SET_ASSET_PERMISSION = 'project/settings/networking/SET_ASSET_PERMISSION'
const SET_DEFAULT_PUPPET = 'project/settings/networking/SET_DEFAULT_PUPPET'
const ADD_SHARED_PUPPET = 'project/settings/networking/ADD_SHARED_PUPPET'
const REMOVE_SHARED_PUPPET = 'project/settings/networking/REMOVE_SHARED_PUPPET'
const SET_SHARED_PUPPETS = 'project/settings/networking/SET_SHARED_PUPPETS'

// Add Asset Permissions
export const ANYONE = 2
export const ADMINS_ONLY = 1
export const HOST_ONLY = 0

// Action Creators
export function setNetworking(networking) {
    return (dispatch, getState) => {
        const {
            roomName: name, roomPassword: password, addAssetPermission, defaultPuppet, sharedPuppets
        } = (networking || {})
        dispatch({ type: SET_ROOM, name: name || 'lobby' })
        dispatch({ type: SET_PASSWORD, password: password || '' })
        dispatch({ type: SET_ASSET_PERMISSION, permission: addAssetPermission || HOST_ONLY })
        dispatch({ type: SET_DEFAULT_PUPPET, puppet: defaultPuppet || Object.keys(getState().project.characters)[0] || "1" })
        dispatch({ type: SET_SHARED_PUPPETS, puppets: sharedPuppets || [] })
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

export function addSharedPuppet(puppet) {
    return { type: ADD_SHARED_PUPPET, puppet }
}

export function removeSharedPuppet(puppet) {
    return { type: REMOVE_SHARED_PUPPET, puppet }
}

export function setSharedPuppets(puppets) {
    return { type: SET_SHARED_PUPPETS, puppets }
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

const sharedPuppetsReducer = util.createReducer([], {
    [ADD_SHARED_PUPPET]: (state, action) => [...state, action.puppet],
    [REMOVE_SHARED_PUPPET]: (state, action) => {
        const index = state.indexOf(action.puppet)
        return [...state.slice(0, index), ...state.slice(index + 1)]
    },
    [SET_SHARED_PUPPETS]: (state, action) => action.puppets
})

export default combineReducers({
    roomName: roomNameReducer,
    roomPassword: roomPasswordReducer,
    addAssetPermission: addAssetPermissionReducer,
    defaultPuppet: defaultPuppetReducer,
    sharedPuppets: sharedPuppetsReducer
})
