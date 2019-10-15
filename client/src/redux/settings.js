import { combineReducers } from 'redux'
import util from './util.js'

const settings = window.require('electron').remote.require('./main-process/settings')

// Action Types
const SAVE_LAYOUT = 'settings/SAVE_LAYOUT'
const LOAD_LAYOUT = 'settings/LOAD_LAYOUT'

// Action Creators
export function saveLayout(layout) {
    return { type: SAVE_LAYOUT, layout }
}

export function loadLayout(layout) {
    return (dispatch, getState) => {
        dispatch({ type: LOAD_LAYOUT })
        dispatch({ type: SAVE_LAYOUT, layout })
    }
}

// Reducers
const layoutReducer = util.createReducer(settings.settings.layout, {
    [SAVE_LAYOUT]: (state, action) => {
        settings.setLayout(action.layout)
        settings.save()
        return action.layout
    }
})

const layoutUpdateReducer = util.createReducer(0, {
    [LOAD_LAYOUT]: state => state + 1
})

export default combineReducers({
    layout: layoutReducer,
    layoutUpdate: layoutUpdateReducer
})
