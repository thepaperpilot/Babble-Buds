import layers from './layers'

const util = require('./../util')

export const DEFAULTS = {
    id: null,
    character: null,
    layer: null,
    emote: 0
}

export default util.createReducer(DEFAULTS, 
    Object.assign(layers, {
    }))