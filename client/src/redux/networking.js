import { combineReducers } from 'redux'
import { batch } from 'react-redux'
import util from './util.js'
import { info, log, warn, error, inProgress, inProgressIncrement } from './status'
import { setActors as setControllerActors } from './controller'
import { setEnvironment, setDefaultEnvironment } from './environment'
import {
    addActor, newActor, removeActor,
    moveRight, movePuppet,
    changePuppet, setEmote,
    setBabbling, jiggle,
    banishActor, setActors
} from './actors'
import { setRoomPassword } from './project/settings/networking'
import { addAssets, deleteAssets } from './project/assets/actions'
import io from 'socket.io-client'
import ss from 'socket.io-stream'
import semver from 'semver'

const fs = window.require('fs-extra')
const path = require('path')
const { remote, ipcRenderer } = window.require('electron')
const settingsManager = remote.require('./main-process/settings')

// Non-redux state
let socket = null
let downloadingAssetsStatusId = 0

// Action Types
const CONNECT = 'networking/CONNECT'
const DISCONNECT = 'networking/DISCONNECT'
const CLEAR_ROOM = 'networking/CLEAR_ROOM'
const JOIN_ROOM = 'networking/JOIN_ROOM'
const CLEAR_USERS = 'networking/CLEAR_USERS'
const ADD_USER = 'networking/ADD_USER'
const UPDATE_USER = 'networking/UPDATE_USER'
const REMOVE_USER = 'networking/REMOVE_USER'
const SET_SELF = 'networking/SET_SELF'

// Action Creators
function onDisconnect(dispatch) {
    socket.close()
    socket = null
    dispatch(info('Disconnected from server'))
    dispatch({ type: DISCONNECT })
    dispatch({ type: CLEAR_ROOM })
    dispatch(setSinglePlayer())
}

function onJoinRoom(dispatch, getState, room, self, isHost) {
    dispatch({ type: SET_SELF, self })
    dispatch({ type: JOIN_ROOM, room })

    const state = getState()
    const assets = state.project.assets

    dispatch({
        type: ADD_USER,
        user: {
            id: self,
            actors: state.controller.actors,
            nickname: state.project.settings.nickname,
            isAdmin: isHost,
            isHost
        }
    })

    Object.keys(assets).forEach(id => {
        socket.emit('add asset', id, assets[id])
    })
    state.actors.filter(actor => state.controller.actors.includes(actor.id))
        .forEach(actor => socket.emit('add actor', actor))
}

function banishPuppets(dispatch, getState) {
    batch(() => getState().actors.forEach(actor => dispatch(banishActor(actor.id))))    
}

export function disconnect() {
    if (socket) {
        socket.disconnect()
    }
}

export function setSinglePlayer(openingProject = false) {
    return (dispatch, getState) => {
        batch(() => {
            const state = getState()

            // First see if we're already controlling a character,
            //  in which case just remove all characters we're not controlling
            if (state.controller.actors.length > 0) {
                state.actors.filter(actor => !state.controller.actors.includes(actor.id))
                    .forEach(actor => dispatch(removeActor(actor.id)))
            } else {
                // If we're not controlling any, just remove all of them
                state.actors.forEach(actor => dispatch(removeActor(actor.id)))

                // We're also probably loading a project
                // So set our puppet to the first on our hotbar
                //  (and even if we're not, we should still add in at least one puppet to control)
                const hotbar = state.project.settings.hotbar
                let puppetId = hotbar.find(i => i in state.project.characters)
                
                // Unless our hotbar is somehow completely empty/invalid
                if (puppetId == null) {
                    // Try finding the first character we have
                    puppetId = Object.keys(state.project.characters)[0]
                }

                if (puppetId != null) {
                    dispatch(newActor(0, puppetId, state.project.characters[puppetId]))
                    dispatch(setControllerActors([0]))
                    setTimeout(() => dispatch(moveRight(0)), 1000)
                }
            }

            // First see if we're already using one of our environments
            if (state.environment.setter !== state.self || openingProject) {
                // Then see if we have an environment on our hotbar
                const hotbar = state.project.settings.environmentHotbar
                let envId = hotbar.find(i => i in state.project.environments)

                if (envId == null) {
                    dispatch(setDefaultEnvironment())
                } else {
                    dispatch(setEnvironment(state.self, envId, state.project.environments[envId]))
                }
            }
        })
    }
}

export function connectToRoom() {
    return (dispatch, getState) => {
        // If socket isn't null and this button was still pressable,
        //  then we're currently still trying to connect
        // So we'll assume that means the user actually wants to stop trying to connect
        if (socket != null) {
            onDisconnect(dispatch)
            return
        }
        dispatch(info('Connecting to server...'))

        const {ip, port} = getState().project.settings.networking
        
        socket = io.connect(`http://${ip}:${port}`, {reconnect: true, transports: ['websocket', 'xhr-polling']})

        // Connection Listeners
        socket.on('connect', () => {
            if (socket == null) return
            dispatch(info('Connected to server!'))
            dispatch({ type: CONNECT })
            // Join room
            const state = getState()
            const {roomName, roomPassword} = state.project.settings.networking
            socket.emit('connect to room', roomName, roomPassword, state.project.settings.nickname, state.environment)
        })
        socket.on('disconnect', () => onDisconnect(dispatch))
        socket.on('connect_error', (e) => dispatch(error('Failed to connect.', e)))
        socket.on('connect_timeout', (e) => dispatch(error('Connection timed out.', e)))
        socket.on('error', (e) => dispatch(error('Server error.', e)))
        socket.on('reconnect', () => dispatch(info('Reconnected.')))
        socket.on('reconnecting', () => dispatch(info('Reconnecting...')))
        socket.on('reconnect_error', (e) => dispatch(error('Failed to reconnect.', e)))
        socket.on('recconect_failed', (e) => {
            dispatch(error('Failed to reconnect. Not retrying.', e))
            onDisconnect(dispatch)
        })
        socket.on('info', (message) => dispatch(log(message)))

        // Room Listeners
        socket.on('joined room', (name, id, isHost) => {
            dispatch(log(`Joined room "${name}"`))
            onJoinRoom(dispatch, getState, name, id, isHost)
        })
        socket.on('leave room', () => {
            if (socket != null)
                socket.disconnect()
        })

        // Settings Listeners
        socket.on('serverVersion', (version) => {
            const ourVersion = getState().project.settings.clientVersion
            if(!semver.intersects(version, ourVersion) && socket != null) {
                socket.disconnect()
                dispatch(warn(`Server Version Mismatch! Server required ${version}, our version: ${ourVersion}`))
            }
        })
        socket.on('assign actor', (oldId, newId) => {
            batch(() => {
                const state = getState()
                dispatch(setActors(state.actors.map(actor =>
                    actor.id === oldId ? util.updateObject(actor, { id: newId }) : actor)))
                dispatch(setControllerActors(state.controller.actors.map(id => id === oldId ? newId : id)))
                
                const user = getState().networking.connectedUsers.find(user => user.id === state.networking.self)
                const actors = user.actors.map(actor => actor === oldId ? newId : actor)
                dispatch({ type: UPDATE_USER, id: getState().networking.self, user: { actors } })
                ipcRenderer.send('background', 'get thumbnail URI', newId, state.actors.find(actor => actor.id === oldId).character)
            })
        })
        socket.on('change nickname', (id, nickname) => {
            dispatch(log(`User "${getState().networking.connectedUsers.find(user => user.id === id).nickname}" changed their nickname to "${nickname}"`))
            dispatch({ type: UPDATE_USER, id, user: { nickname } })
        })

        // Room Management Listeners
        socket.on('demote', (id) => {
            dispatch({ type: UPDATE_USER, id, user: { isAdmin: false } })
        })
        socket.on('promote', (id) => {
            dispatch({ type: UPDATE_USER, id, user: { isAdmin: true } })
        })
        socket.on('set host', (id) => {
            const oldHost = getState().networking.connectedUsers.find(user => user.isHost).id
            dispatch({ type: UPDATE_USER, id: oldHost, user: { isHost: false } })
            dispatch({ type: UPDATE_USER, id, user: { isAdmin: true, isHost: true }})
        })
        socket.on('change password', (password) => {
            dispatch(setRoomPassword(password))
        })
        socket.on('set environment', (setter, envId, environment) => {
            dispatch(setEnvironment(setter, envId, environment, true))
        })

        // Actor Listeners
        socket.on('add user', (id, actors, nickname, isAdmin, isHost) => {
            dispatch(log(`User "${nickname}" connected to your room`))
            Object.keys(actors).forEach(actor => {
                actors[actor].id = actor
                dispatch(addActor(actors[actor]))
            })
            dispatch({
                type: ADD_USER,
                user: {
                    id,
                    actors: Object.keys(actors),
                    nickname,
                    isAdmin,
                    isHost
                }
            })
            Object.values(actors).forEach(actor =>
                ipcRenderer.send('background', 'get thumbnail URI', actor.id, actor.character))
        })
        socket.on('add actor', (user, id, actor) => {
            actor.id = id
            dispatch(addActor(actor))
            const actors =
                getState().networking.connectedUsers.find(u => u.id === user).actors
            dispatch({
                type: UPDATE_USER,
                id: user,
                user: {
                    actors: [...actors, id]
                }
            })
            ipcRenderer.send('background', 'get thumbnail URI', actor.id, actor.character)
        })
        socket.on('set puppet', (id, puppet) => {
            dispatch(changePuppet(id, puppet.id, puppet))
            ipcRenderer.send('background', 'get thumbnail URI', id, puppet)
        })
        socket.on('set emote', (id, emote) => dispatch(setEmote(id, emote)))
        socket.on('move puppet', (id, position, facingLeft) => dispatch(movePuppet(id, position, facingLeft)))
        socket.on('start babbling', (id) => dispatch(setBabbling(id, true)))
        socket.on('stop babbling', (id) => dispatch(setBabbling(id, false)))
        socket.on('jiggle', (id) => dispatch(jiggle(id)))
        socket.on('banish', () => banishPuppets(dispatch, getState))
        socket.on('remove user', (id) => {
            batch(() => {
                const user = getState().networking.connectedUsers.find(user => user.id === id)
                dispatch(log(`User "${user.nickname}" left your room`))
                user.actors.forEach(actor => dispatch(removeActor(actor)))
                dispatch({ type: REMOVE_USER, id })
            })
        })

        // Asset Listeners
        socket.on('delete asset', (id) => dispatch(deleteAssets([ id ])))
        socket.on('add assets', (assets) => {
            const project = getState().project
            const statusId = `downloading-${downloadingAssetsStatusId++}`
            const filteredAssets = Object.keys(assets).filter(id => !(id in project.assets) || assets[id].version > project.assets[id].version)
            if (filteredAssets.length === 0) return
            dispatch(inProgress(statusId, filteredAssets.length, 'Retrieving Assets from Server'))
            filteredAssets.forEach(id => {
                let stream = ss.createStream()
                fs.ensureDirSync(path.join(project.assetsPath, id.split(':')[0]))
                ss(socket).emit('request asset', stream, id)
                stream.on('end', () => {
                    dispatch(addAssets({ [id]: assets[id] }))
                    dispatch(inProgressIncrement(statusId))
                })
                stream.pipe(fs.createWriteStream(path.join(project.assetsPath, id.split(':')[0], `${id.split(':')[1]}.png`)))
            })
        })
        socket.on('add asset', (id, asset) => {
            const project = getState().project
            const statusId = `downloading-${downloadingAssetsStatusId++}`
            if (id in project.assets && asset.version <= project.assets[id].version) return
            dispatch(inProgress(statusId, 1, 'Retrieving Asset from Server'))
            let stream = ss.createStream()
            fs.ensureDirSync(path.join(project.assetsPath, id.split(':')[0]))
            ss(socket).emit('request asset', stream, id)
            stream.on('end', () => {
                dispatch(addAssets({ [id]: asset }))
                dispatch(inProgressIncrement(statusId))
            })
            stream.pipe(fs.createWriteStream(path.join(project.assetsPath, id.split(':')[0], `${id.split(':')[1]}.png`)))
        })
        ss(socket).on('request asset', (stream, id) => {
            const project = getState().project
            fs.createReadStream(path.join(project.project, project.settings.assetsPath, project.assets[id].location)).pipe(stream)
        })
    }
}

export function banish() {
    return (dispatch, getState) => {
        dispatch(emit('banish'))
        banishPuppets(dispatch, getState)
    }
}

export function emit(...message) {
    return (dispatch, getState) => {
        if (getState().networking.connectedRoom)
            socket.emit(...message)
    }
}

// Reducers
const isConnectedReducer = util.createReducer(false, {
    [CONNECT]: () => true,
    [DISCONNECT]: () => false
})

const connectedRoomReducer = util.createReducer(null, {
    [CLEAR_ROOM]: () => null,
    [JOIN_ROOM]: (state, action) => action.room
})

const connectedUsersReducer = util.createReducer([], {
    [CLEAR_ROOM]: () => [],
    [ADD_USER]: (state, action) => [...state, action.user],
    [UPDATE_USER]: (state, action) => {
        const users = state.slice()
        const index = state.findIndex(({id}) => id === action.id)
        users[index] = util.updateObject(users[index], action.user)
        return users
    },
    [REMOVE_USER]: (state, action) => {
        const index = state.findIndex(({id}) => id === action.id)
        return [...state.slice(0, index), ...state.slice(index + 1)]        
    }
})

const selfReducer = util.createReducer(null, {
    [SET_SELF]: (state, action) => action.self
})

export default combineReducers({
    isConnected: isConnectedReducer,
    connectedRoom: connectedRoomReducer,
    connectedUsers: connectedUsersReducer,
    self: selfReducer
})
