import util from './util.js'

// Action Types
const INSPECT = 'inspector/INSPECT'

// Action Creators
export function inspect(target = null, targetType = null) {
    return { type: INSPECT, target, targetType }
}

export function close() {
    return { type: INSPECT, target: null, targetType: null }
}

// Reducers
export default util.createReducer({ target: null, targetType: null }, {
    [INSPECT]: (state, action) =>
        ({ target: action.target, targetType: action.targetType })
})
