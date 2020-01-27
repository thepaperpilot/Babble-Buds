import { combineReducers } from 'redux'
import util from '../util.js'
import { comparePaths } from './layers'
import { warn } from '../status'
import { inspect } from '../inspector'

// Action Types
const SELECT_LAYER = 'editor/SELECT_LAYER'
const SET_EMOTE = 'editor/SET_EMOTE'

// Action Creators
export function setEmote(emote = 0) {
    return { type: SET_EMOTE, emote }
}

export function selectLayer(path = [], shouldInspect = true) {
    return (dispatch, getState) => {
        const state = getState()
        const editor = state.editor.present
        const assets = state.project.assets

        if (comparePaths(path, []) || path == null || editor.type === 'particles' && path.length === 1) {
            dispatch({ type: SELECT_LAYER, path })
            if (editor.type === 'particles' && !comparePaths(path, []) && path != null)
                dispatch(inspect(path, 'emitter'))
            return
        }

        let curr = editor.layers
        if (Array.isArray(curr))
            dispatch({ type: SELECT_LAYER, path })
        let emote = null
        for (let i = 0; i < path.length; i++) {
            if (curr.children == null || curr.children.length <= path[i]) {
                dispatch(warn("Unable to select that layer: Layer not found."))
                return
            }
            curr = curr.children[path[i]]
            if (curr.emote != null)
                emote = curr.emote
        }

        if (emote == null && curr.id != null && curr.id in assets) {
            const asset = assets[curr.id]
            if (asset.type === 'bundle' &&
                !asset.conflicts.emotes.includes(editor.selected.emote)) {
                emote = asset.conflicts.emotes[0]
            }
        }

        if (emote != null)
            dispatch({ type: SET_EMOTE, emote })

        dispatch({ type: SELECT_LAYER, path })
        if (shouldInspect)
            dispatch(inspect(path, "layer"))
    }
}

export function clearSelected() {
    return dispatch => {
        dispatch({ type: SELECT_LAYER, path: null })
        dispatch({ type: SET_EMOTE, emote: 0 })
    }
}

// Reducers
const layerReducer = util.createReducer(null, {
    [SELECT_LAYER]: (state, action) => action.path
})

const emoteReducer = util.createReducer(0, {
    [SET_EMOTE]: (state, action) => action.emote
})

export default combineReducers({
    layer: layerReducer,
    emote: emoteReducer
})
