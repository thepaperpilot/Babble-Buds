import { combineReducers } from 'redux'
import util from '../../util.js'

// Action Types
const SET_IP = 'project/settings/networking/SET_IP'
const SET_PORT = 'project/settings/networking/SET_PORT'
const SET_ROOM = 'project/settings/networking/SET_ROOM'
const SET_PASSWORD = 'project/settings/networking/SET_PASSWORD'

// Action Creators
export function setNetworking(networking) {
    return dispatch => {
        const { ip, port, roomName: name, roomPassword: password } = (networking || {})
        dispatch({ type: SET_IP, ip: ip || 'babblebuds.xyz' })
        dispatch({ type: SET_PORT, port: port || 8080 })
        dispatch({ type: SET_ROOM, name: name || 'lobby' })
        dispatch({ type: SET_PASSWORD, password: password || '' })
    }
}

export function setIP(ip) {
    return { type: SET_IP, ip }
}

export function setPort(port) {
    return { type: SET_PORT, port }
}

export function setRoomName(name) {
    return { type: SET_ROOM, name }
}

export function setRoomPassword(password) {
    return { type: SET_PASSWORD, password }
}

// Reducers
const ipReducer = util.createReducer('babblebuds.xyz', {
    [SET_IP]: (state, action) => action.ip
})

const portReducer = util.createReducer(8080, {
    [SET_PORT]: (state, action) => action.port
})

const roomNameReducer = util.createReducer('lobby', {
    [SET_ROOM]: (state, action) => action.name
})

const roomPasswordReducer = util.createReducer('', {
    [SET_PASSWORD]: (state, action) => action.password
})

export default combineReducers({
    ip: ipReducer,
    port: portReducer,
    roomName: roomNameReducer,
    roomPassword: roomPasswordReducer
})
