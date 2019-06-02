import layers, { updatePaths } from './layers'

const util = require('./../util')

export const DEFAULTS = {
    id: null,
    character: null,
    oldCharacter: null,
    type: null,
    layer: null,
    emote: 0
}

function editPuppet(state, action) {
    const {layers} = updatePaths(action.character.layers)
    const character = util.updateObject(action.character, { layers })
    return util.updateObject(state, {
        id: action.id,
        character,
        oldCharacter: JSON.stringify(character),
        type: action.objectType || 'puppet',
        layer: null,
        emote: action.emote || 0
    })
}

function selectEmote(state, action) {
    return util.updateObject(state, { emote: action.emote })
}

function newAssetBundle(state, action) {
    const layers = JSON.parse(JSON.stringify(state.character.layers))
    const curr = action.path.slice(0, -1).reduce((layer, index) => layer.children[index], layers)
    const lastIndex = action.path[action.path.length - 1]
    curr.children[lastIndex] = util.updateObject(curr.children[lastIndex], {
        id: action.id
    })
    delete curr.children[lastIndex].children

    const character = util.updateObject(state.character, { layers })
    return util.updateObject(state, { character })
}

function updateThumbnails(type) {
    return (state, action) => {
        if (type === state.type && action.id === state.id) {
            const changes = {
                location: `${action.thumbnailsPath.split('/').slice(-2).join('/')}.png`,
                version: state.character.version + 1
            }
            const character = util.updateObject(state.character, changes)
            const oldCharacter = JSON.stringify(util.updateObject(JSON.parse(state.oldCharacter), changes))

            return util.updateObject(state, { character, oldCharacter })
        }
        return state
    }
}

export default util.createReducer(DEFAULTS, 
    Object.assign(layers, {
        'EDIT_PUPPET': editPuppet,
        'SET_EDITOR_EMOTE': selectEmote,
        'NEW_ASSET_BUNDLE': newAssetBundle,
        'UPDATE_ASSET_THUMBNAILS': updateThumbnails('asset')
    }))
