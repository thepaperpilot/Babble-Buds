import { combineReducers } from 'redux'
import util from './util.js'

const settings = window.require('electron').remote.require('./main-process/settings')

// Action Types
const SAVE_LAYOUT = 'settings/SAVE_LAYOUT'
const LOAD_LAYOUT = 'settings/LOAD_LAYOUT'
const SET_ADDRESS = 'settings/SET_ADDRESS'

// Action Creators
export function saveLayout(layout) {
    return { type: SAVE_LAYOUT, layout }
}

export function loadLayout(layout) {
    return (dispatch, getState) => {
        dispatch({ type: SAVE_LAYOUT, layout })
        dispatch({ type: LOAD_LAYOUT })
    }
}

export function setAddress(address) {
    return { type: SET_ADDRESS, address }
}

export function saveAddress(address) {
    return (dispatch, getState) => {
        dispatch({ type: SET_ADDRESS, address })
        settings.setAddress(address)
        settings.save()
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

const addressReducer = util.createReducer('babblebuds.xyz', {
    [SET_ADDRESS]: (state, action) => action.address
})

export default combineReducers({
    layout: layoutReducer,
    layoutUpdate: layoutUpdateReducer,
    address: addressReducer
})
