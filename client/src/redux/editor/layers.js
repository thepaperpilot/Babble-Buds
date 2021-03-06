import { Puppet } from 'babble.js'
import util from '../util.js'
import { warn } from '../status'
import { close } from '../inspector'
import { setEmote, selectLayer } from './selected'
import defaultEmitter from '../../data/emitter.json'

// Action Types
const CHANGE_LAYERS = 'editor/layers/CHANGE_LAYERS'

// Utility Functions
// Takes two objects and returns if they are two arrays with equivalent values
export function comparePaths(a, b) {
    if (!(a instanceof Array && b instanceof Array))
        return false
    if (a.length !== b.length)
        return false
    for (let i = 0; i < a.length; i++)
        if (a[i] !== b[i]) {
            return false
        }
    return true
}

// Takes a layer and recursively travels down each child, updating paths and inheritance values
export function updatePaths(layers, l = null, inherit = {}, path = []) {
    let selected = l
    const parseLayer = function(layer, inherit, path) {
        Object.keys(inherit).forEach(k => inherit[k] == null && delete inherit[k])
        let children
        if (layer.children) {
            const inh = Puppet.getInherit(layer, inherit)
            children = layer.children.map((child, i) => parseLayer(child, inh, path.concat(i)))
        }
        if (comparePaths(layer.path, l))
            selected = path
        layer = util.updateObject(layer, { inherit, path, children })
        Object.keys(inherit).forEach(k => delete layer[k])
        return layer
    }
    if (layers.children)
        layers.children = layers.children.map((l, i) => parseLayer(l, inherit, path.concat(i)))
    return selected
}

// Traverses a path of children in a layer
// Optionally creates new versions of each layer in the path for immutability
function getLayerAtPath(layer, path, immutable = false) {
    let curr = layer
    for (let i = 0; i < path.length; i++) {
        if (curr.children == null || curr.children.length <= path[i])
            return null
        if (immutable) {
            curr.children = curr.children.slice()
            curr = curr.children[path[i]] = util.updateObject(curr.children[path[i]])
        } else  curr = curr.children[path[i]]
    }
    return curr
}

// Checks if there is, in fact, something open in the Editor
function checkEditor(dispatch, state) {
    if (state.editor.present.id == null) {
        dispatch(warn("Can't perform action. Nothing is currently open in the Editor."))
        return false
    }
    return true
}

// Action Creators
export function changeLayer(path, layer = {}) {
    return (dispatch, getState) => {
        const state = getState()
        if (!checkEditor(dispatch, state)) return

        if (getState().editor.present.type === 'particles') {
            let layers = state.editor.present.layers.slice()
            layers[path[0]] = util.updateObject(layers[path[0]], { emitter: util.updateObject(layers[path[0]].emitter, layer) })
            dispatch({ type: CHANGE_LAYERS, layers })
            return
        }

        let layers = util.updateObject(state.editor.present.layers || {})
        if (Array.isArray(state.editor.present.layers)) layers = {}
        let curr = getLayerAtPath(layers, path.slice(0, -1), true)
        
        if (curr == null) {
            dispatch(warn("Unable to change that layer: Layer not found."))
            return
        }

        // Change the layer
        // Similar to how we handled the ancestors, but now our
        //  updateObject call also has the changes we need to make
        curr.children = curr.children ? curr.children.slice() : []
        const index = path[path.length - 1]
        if (index == null) {
            // Updating root layer
            curr = layers = util.updateObject(layers, layer)
        } else
            curr = curr.children[index] = util.updateObject(curr.children[index], layer)

        // Delete special values
        if ('head' in layer && layer.head === false)
            delete curr.head
        if ('emoteLayer' in layer && layer.emoteLayer === 'base')
            delete curr.emoteLayer

        // If we changed our children, update their paths
        let newSelected = state.editor.present.selected.layer
        if ('children' in layer) {
            newSelected =
                updatePaths(curr, state.editor.present.selected.layer, curr.inherit, curr.path)
        }

        // Store our new layers object
        dispatch({ type: CHANGE_LAYERS, layers })
        
        // Reselect moved layer, if applicable
        if (newSelected !== state.editor.present.selected.layer) {
            dispatch(selectLayer(newSelected))
        }
    }
}

export function changeEmitter(path, emitter = {}) {
    return (dispatch, getState) => {
        const layers = getState().editor.present.layers.slice()
        emitter = util.updateObject(layers[path[0]].emitter, emitter)
        layers[path[0]] = util.updateObject(layers[path[0]], { emitter })
        dispatch({ type: CHANGE_LAYERS, layers })
    }
}

export function changeEmitterName(path, name) {
    return (dispatch, getState) => {
        const layers = getState().editor.present.layers.slice()
        layers[path[0]] = util.updateObject(layers[path[0]], { name })
        dispatch({ type: CHANGE_LAYERS, layers })
    }
}

// Use this as a shorthand for changing the editor's root layer
export function setLayers(layers) {
    if (Array.isArray(layers))
        return { type: CHANGE_LAYERS, layers }
    return changeLayer([], layers)
}

export function clear() {
    return { type: CHANGE_LAYERS, layers: null }
}

// Use this method to change the layer's emote,
//  and handle changing the puppet to the proper emote
export function changeEmote(path, emote = null) {
    return (dispatch, getState) => {
        const state = getState()
        if (!checkEditor(dispatch, state)) return

        dispatch(changeLayer(path, { emote }))

        // Set what emote is visible now
        if (emote != null)
            dispatch(setEmote(emote))
        else {
            const layers = state.editor.present.layers
            const assets = state.project.assets
            const curr = getLayerAtPath(layers, path)

            // Check if its an asset bundle, in which case change to an internal emote
            // (if there is one)
            if (curr && 'id' in curr && curr.id in assets) {
                const asset = assets[curr.id]
                if (asset.type === 'bundle' && asset.conflicts.emotes.length > 0) {
                    dispatch(setEmote(asset.conflicts.emotes[0]))
                    return
                }
            }

            dispatch(setEmote())
        }   
    }
}

export function deleteLayer(path) {
    return (dispatch, getState) => {
        const state = getState()
        if (!checkEditor(dispatch, state)) return

        if (path.length === 0) {
            dispatch(warn("You can't delete the root layer."))
            return
        }

        const { layers, selected } = state.editor.present

        const curr = getLayerAtPath(layers, path.slice(0, -1))
        const index = path[path.length - 1]
        if (curr == null || curr.children == null || curr.children.length <= index) {
            dispatch(warn("Unable to delete layer: Layer not found."))
            return
        }

        const children = curr.children.slice()
        children.splice(index, 1)
        dispatch(changeLayer(path.slice(0, -1), { children }))

        if (children.length === 0 && selected.layer && comparePaths(path, selected.layer.slice(0, path.length)))
            dispatch(selectLayer(path.slice(0, -1)))

        if (state.inspector.targetType === 'layer' && comparePaths(state.inspector.target.slice(0, path.length), path))
            dispatch(close())
    }
}

export function deleteEmitter(path) {
    return (dispatch, getState) => {
        const state = getState()
        if (!checkEditor(dispatch, state)) return

        if (path.length === 0) {
            dispatch(warn("You can't delete the root layer."))
            return
        }

        const layers = state.editor.present.layers.slice()
        layers.splice(path[0], 1)
        dispatch({ type: CHANGE_LAYERS, layers })
    }
}

export function addLayer(path, layer = {}) {
    return (dispatch, getState) => {
        const state = getState()
        if (!checkEditor(dispatch, state)) return

        const layers = state.editor.present.layers

        if (Array.isArray(layers)) {
            const emitter = Object.keys(layer).length === 0 ?
                { name: 'New Emitter', emitter: defaultEmitter } : layer
            dispatch({ type: CHANGE_LAYERS, layers: [...layers, emitter] })

            return
        }

        const curr = getLayerAtPath(layers, path)
        if (curr == null) {
            dispatch(warn("Unable to add layer: Layer not found."))
            return
        }
        if (curr.id) {
            dispatch(warn("Unable to add child layer to an asset layer."))
            return
        }
        const children = curr.children ? curr.children.slice() : []

        const newLayer = Object.assign({
            name: 'New Layer',
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            x: 0,
            y: 0
        }, layer)
        if (newLayer.id == null)
            newLayer.children = []
        children.push(newLayer)

        dispatch(changeLayer(path, { children }))
    }
}

export function wrapLayer(path) {
    return (dispatch, getState) => {
        const state = getState()
        if (!checkEditor(dispatch, state)) return

        const layers = state.editor.present.layers
        
        // Get the parent of the layer to be wrapped
        const curr = getLayerAtPath(layers, path.slice(0, -1))
        const index = path[path.length - 1]
        if (curr == null || curr.children == null || curr.children.length <= index) {
            dispatch(warn("Unable to wrap layer: Layer not found."))
            return
        }

        // Create our new layers
        // No need to calculate paths or inherits because changeLayer will for us
        const child = util.updateObject(curr.children[index])
        const container = {
            children: [ child ],
            name: 'New Layer'
        }

        // Move inherited properties from child to container
        container.head = child.head
        container.emote = child.emote
        container.emoteLayer = child.emoteLayer
        delete child.head
        delete child.emote
        delete child.emoteLayer

        // Create new children array
        const children = curr.children.slice()
        children.splice(index, 1, container)

        dispatch(changeLayer(path.slice(0, -1), { children }))
    }
}

// Reducers
export default util.createReducer(null, {
    [CHANGE_LAYERS]: (state, action) => action.layers
})
