exports.createReducer = function(initialState, handlers, fallback) {
    return (state = initialState, action) => {
        if (handlers.hasOwnProperty(action.type)) {
            return handlers[action.type](state, action)
        } else {
            return fallback ? fallback(state, action) : state
        }
    }
}

/**
 * Creates a new object with all the fields from oldObject, but
 * applying any fields in newValues over it
 * @param {object} oldObject the object you're updating
 * @param {object} newValues any new or updated values
 */
exports.updateObject = function (oldObject, newValues) {
    return Object.assign({}, oldObject, newValues)
}
