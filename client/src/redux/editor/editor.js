import { combineReducers } from 'redux'
import undoable, { ActionCreators } from 'redux-undo'
import util from '../util.js'
import layers, { setLayers } from './layers'
import { selectLayer, setEmote } from './selected'
import selected from './selected'
import { changeCharacter } from '../project/characters/actions'
import { setLayers as setAssetLayers } from '../project/assets/actions'
import { changePuppet } from '../actors'
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

export function save() {
    return (dispatch, getState) => {
        const state = getState()
        const project = state.project
        const editor = state.editor.present
        
        let character = null

        switch (editor.type) {
        case 'puppet': {
            character = util.updateObject(project.characters[editor.id], {
                layers: editor.layers
            })
            dispatch(changeCharacter(editor.id, { layers: character.layers }))

            // Update any of our actors currently using this puppet
            state.controller.actors.forEach(id => {
                state.actors.filter(actor => actor.id === id)
                    .forEach(actor => dispatch(changePuppet(id, editor.id, character)))
            })

            break
        }
        case 'asset': {
            character = util.updateObject(project.assets[editor.id], {
                layers: editor.layers
            })
            dispatch(setAssetLayers(editor.id, character.layers))
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
