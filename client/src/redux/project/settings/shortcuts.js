import util from '../../util.js'

const ipcRenderer = window.require('electron').ipcRenderer

// Action Types
const SET_ALL = 'project/settings/shortcuts/SET_ALL'
const SET = 'project/settings/shortcuts/SET'

// Action Creators
export function setShortcuts(shortcuts) {
    return (dispatch, getState) => {
        const settings = getState().project.settings
        
        ipcRenderer.send('global',
            Object.keys(settings.shortcuts).map(k => ({
                accel: settings.shortcuts[k],
                shortcut: k
            })),
            Object.keys(shortcuts).map(k => ({
                accel: shortcuts[k],
                shortcut: k
            })))

        dispatch({ type: SET_ALL, shortcuts })
    }
}

export function setShortcut(shortcut, accelerator) {
    return (dispatch, getState) => {
        const shortcuts = getState().project.settings.shortcuts

        ipcRenderer.send('global', [
            {
                accel: shortcuts[shortcut],
                shortcut: shortcut
            }
        ], [
            {
                accel: accelerator,
                shortcut: shortcut
            }
        ])

        dispatch({ type: SET, shortcut, accelerator })
    }
}

// Reducers
export default util.createReducer({
    'Select puppet 1': null,
    'Select puppet 2': null,
    'Select puppet 3': null,
    'Select puppet 4': null,
    'Select puppet 5': null,
    'Select puppet 6': null,
    'Select puppet 7': null,
    'Select puppet 8': null,
    'Select puppet 9': null,
    'Select emote 1': null,
    'Select emote 2': null,
    'Select emote 3': null,
    'Select emote 4': null,
    'Select emote 5': null,
    'Select emote 6': null,
    'Select emote 7': null,
    'Select emote 8': null,
    'Select emote 9': null,
    'Select emote 10': null,
    'Select emote 11': null,
    'Select emote 12': null,
    'Toggle babbling': null,
    'Move left': null,
    'Move right': null,
    'Jiggle': null
}, {
    [SET_ALL]: (state, action) => action.shortcuts,
    [SET]: (state, action) => ({...state, [action.shortcut]: action.accelerator })
})
