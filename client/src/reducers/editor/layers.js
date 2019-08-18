const util = require('./../util')

export function updatePaths(layers, l) {
    let selected = l
    const parseLayer = function(layer, inherit = {}, path = []) {
        Object.keys(inherit).forEach(k => inherit[k] == null && delete inherit[k])
        if (layer.children) {
            const inh = Object.assign((({ head, emote, emoteLayer }) =>
                ({ head, emote, emoteLayer }))(layer), inherit)
            layer.children.forEach((child, i) => parseLayer(child, inh, path.concat(i)))
        }
        if (JSON.stringify(layer.path) === JSON.stringify(l))
            selected = path
        layer.inherit = inherit
        layer.path = path
        return layer
    }
    return {layers: parseLayer(layers), layer: selected}
}

function selectLayer(state, action) {
    let curr = state.character.layers
    let emote = null
    action.path.forEach(index => {
        curr = curr.children[index]
        if (curr.emote != null)
            emote = curr.emote
    })
    emote = emote == null ? state.emote : emote
    return util.updateObject(state, { layer: action.path, emote })
}

function setLayers(state, action) {
    const {layers, layer} = updatePaths(action.tree, state.layer)
    const character = util.updateObject(state.character, { layers })
    requestAnimationFrame(() => action.callback(layer))
    return util.updateObject(state, { character, layer })
}

function editLayer(state, action) {
    const layers = JSON.parse(JSON.stringify(state.character.layers))
    let curr = layers
    action.layer.forEach(index => {
        curr = curr.children[index]
    })
    if ((action.key === 'head' && action.value === false) ||
        (action.key === 'emoteLayer' && action.value === 'base'))
        delete curr[action.key]
    else
        curr[action.key] = action.value
    const character = util.updateObject(state.character, { layers: updatePaths(layers).layers })
    return util.updateObject(state, { character })
}

function editPosition(state, action) {
    const layers = JSON.parse(JSON.stringify(state.character.layers))
    let curr = layers
    action.layer.forEach(index => {
        curr = curr.children[index]
    })
    curr.x = action.pos[0]
    curr.y = -action.pos[1]
    const character = util.updateObject(state.character, { layers })
    return util.updateObject(state, { character })
}

function editScale(state, action) {
    const layers = JSON.parse(JSON.stringify(state.character.layers))
    let curr = layers
    action.layer.forEach(index => {
        curr = curr.children[index]
    })
    curr.scaleX = action.scale[0]
    curr.scaleY = action.scale[1]
    if (action.pos) {
        curr.x = action.pos[0]
        curr.y = action.pos[1]
    }
    const character = util.updateObject(state.character, { layers })
    return util.updateObject(state, { character })
}

function editEmote(state, action) {
    const layers = JSON.parse(JSON.stringify(state.character.layers))
    let curr = layers
    action.layer.forEach(index => {
        curr = curr.children[index]
    })
    curr.emote = action.emote
    const parseLayer = function(layer) {
        if (layer.children) {
            layer.children.forEach(parseLayer)
        }
        layer.emote = null
        return layer
    }
    if (curr.children) curr.children.forEach(parseLayer)
    const character = util.updateObject(state.character, { layers: updatePaths(layers).layers })
    return util.updateObject(state, { character, emote: action.emote || 0 })
}

function deleteLayer(state, action) {
    const layers = JSON.parse(JSON.stringify(state.character.layers))
    const curr = action.path.slice(0, -1).reduce((layer, index) => layer.children[index], layers)
    curr.children.splice(action.path[action.path.length - 1], 1)
    let {layers: newLayers, layer} = updatePaths(layers, state.layer)
    if (curr.children.length === 0 && curr !== layers)
        layer = layer.slice(0, -1)
    const character = util.updateObject(state.character, { layers: newLayers })
    return util.updateObject(state, { character, layer })
}

function deleteAsset(state, action) {
    const character = JSON.parse(JSON.stringify(state.character))
    if (!character) return state
    const assetFilter = layer => layer.id !== action.asset
    const parseLayer = layer => {
        if (layer.children) {
            layer.children =
                layer.children.filter(assetFilter).map(parseLayer)
        }
        return layer
    }

    character.layers = parseLayer(character.layers)
    return util.updateObject(state, { character })
}

function addLayer(state, action) {
    const layers = JSON.parse(JSON.stringify(state.character.layers))
    const curr = action.path.reduce((layer, index) => layer.children[index], layers)
    const inherit = Object.assign((({ head, emote, emoteLayer }) =>
        ({ head, emote, emoteLayer }))(curr), curr.inherit)
    Object.keys(inherit).forEach(k => inherit[k] == null && delete inherit[k])
    let layer = Object.assign({
        children: [],
        name: 'New Layer'
    }, action.layer || {}, {
        inherit,
        path: action.path.concat(curr.children.length)
    })
    if ('id' in layer)
        delete layer.children
    curr.children.push(layer)

    const character = util.updateObject(state.character, { layers })
    return util.updateObject(state, { character })
}

function wrapLayer(state, action) {
    const layers = JSON.parse(JSON.stringify(state.character.layers))
    const curr = action.path.slice(0, -1).reduce((layer, index) => layer.children[index], layers)
    const child = curr.children[action.path[action.path.length - 1]]
    const newLayer = Object.assign((({ head, emote, emoteLayer }) =>
        ({ head, emote, emoteLayer }))(child), {
        children: [child],
        inherit: child.inherit,
        name: 'New Layer',
        path: child.path
    })
    Object.keys(newLayer).forEach(k => newLayer[k] == null && delete newLayer[k])
    curr.children.splice(action.path[action.path.length - 1], 1, newLayer)
    child.path.push(0)
    delete child.head
    delete child.emote
    delete child.emoteLayer
    const {layers: newLayers, layer} = updatePaths(layers, state.layer)
    const character = util.updateObject(state.character, { layers: newLayers })
    return util.updateObject(state, { character, layer })
}

function rotateLayer(state, action) {
    const layers = JSON.parse(JSON.stringify(state.character.layers))
    const curr = action.path.reduce((layer, index) => layer.children[index], layers)
    curr.rotation += action.rotation
    const character = util.updateObject(state.character, { layers })
    return util.updateObject(state, { character })
}

export default {
    'SELECT_LAYER': selectLayer,
    'SET_LAYERS': setLayers,
    'EDIT_LAYER': editLayer,
    'EDIT_LAYER_POSITION': editPosition,
    'EDIT_LAYER_SCALE': editScale,
    'EDIT_LAYER_EMOTE': editEmote,
    'DELETE_LAYER': deleteLayer,
    'DELETE_ASSET': deleteAsset,
    'ADD_LAYER': addLayer,
    'WRAP_LAYER': wrapLayer,
    'ROTATE_LAYER': rotateLayer
}
