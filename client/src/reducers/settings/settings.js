const util = require('./../util')

const settings = window.require('electron').remote.require('./main-process/settings')

export const DEFAULTS = {
    layout: settings.settings.layout,
    layoutUpdate: 0
}

function updateLayout(state, action) {
    settings.setLayout(action.layout)
    settings.save()
    return util.updateObject(state, { layout: action.layout })
}

function loadLayout(state, action) {
    settings.setLayout(action.layout)
    settings.save()
    return util.updateObject(state, {
        layout: action.layout,
        layoutUpdate: state.layoutUpdate + 1
    })
}

export default util.createReducer(DEFAULTS, {
    'UPDATE_LAYOUT': updateLayout,
    'LOAD_LAYOUT': loadLayout
})
