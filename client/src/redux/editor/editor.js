import { combineReducers } from 'redux'
import undoable, { ActionCreators } from 'redux-undo'
import util from '../util.js'
import layers, { setLayers, clear } from './layers'
import selected, { selectLayer, setEmote } from './selected'
import { changeEnvironment } from '../project/environments/actions'
import { changeCharacter } from '../project/characters/actions'
import { setLayers as setAssetLayers, setParticles } from '../project/assets/actions'
import { warn } from '../status'

const path = window.require('path')
const ipcRenderer = window.require('electron').ipcRenderer

// Action Types
const OPEN = 'editor/OPEN'

// Action Creators
export function open(id, layers, type = 'puppet', emote = 0) {
    return dispatch => {
        dispatch({ type: OPEN, id, objectType: type })
        dispatch(setEmote(emote))
        dispatch(setLayers(layers))
        dispatch(selectLayer(null, false))
        dispatch(ActionCreators.clearHistory())
    }
}

export function close() {
    return dispatch => {
        dispatch({ type: OPEN, id: null, objectType: null })
        dispatch(clear())
    }
}

export function save() {
    return (dispatch, getState) => {
        const editor = getState().editor.present
        switch (editor.type) {
        case 'environment': {
            dispatch(changeEnvironment(editor.id, { layers: editor.layers }))
            break
        }
        case 'puppet': {
            dispatch(changeCharacter(editor.id, { layers: editor.layers }))
            break
        }
        case 'asset': {
            dispatch(setAssetLayers(editor.id, editor.layers))
            break
        }
        case 'particles': {
            dispatch(setParticles(editor.id, editor.layers))
            break
        }
        default:
            dispatch(warn("Attempting to save editor failed. The type of object open in the editor is unknown."))
            return
        }
    }
}

// Reducers
const idReducer = util.createReducer(null, {
    [OPEN]: (state, action) => action.id
})

const typeReducer = util.createReducer(null, {
    [OPEN]: (state, action) => action.objectType
})

export default undoable(combineReducers({
    id: idReducer,
    type: typeReducer,
    selected,
    layers
}))
