const util = require('./../util')

export const DEFAULTS = {
    target: null,
    targetType: null
}

function inspect(state, action) {
    return util.updateObject(state, {
        target: action.target,
        targetType: action.targetType
    })
}

function removeTarget(targetType) {
    return (state, action) => {
        if (state.targetType === targetType && state.target === action[targetType])
            return { target: null, targetType: null }
        else return state
    }
}

function renameTarget(targetType) {
    return (state, action) => {
        if (state.targetType === targetType && state.target === action.oldName)
            return util.updateObject(state, { target: action.newName })
        return state
    }
}

function selectLayer(state, action) {
    return inspect(state, {
        target: action.path,
        targetType: 'layer'
    })
}

export default util.createReducer(DEFAULTS, {
    'INSPECT': inspect,
    'DELETE_PUPPET': removeTarget('puppet'),
    'DELETE_LAYER': removeTarget('layer'),
    'SELECT_LAYER': selectLayer
})
