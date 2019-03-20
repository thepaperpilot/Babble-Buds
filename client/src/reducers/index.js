import undoable, { excludeAction, groupByActionTypes } from 'redux-undo'
import util from './util'
import project from './project/project'
import { DEFAULTS as PROJECT_DEFAULTS } from './project/defaults'
import inspector, { DEFAULTS as INSPECTOR_DEFAULTS } from './inspector/inspector'
import settings, { DEFAULTS as SETTINGS_DEFAULTS } from './settings/settings'
import status, { DEFAULTS as STATUS_DEFAULTS } from './status/status'
import editor, { DEFAULTS as EDITOR_DEFAULTS } from './editor/editor'

const path = window.require('path')
const {remote, ipcRenderer} = window.require('electron')
const settingsManager = remote.require('./main-process/settings')

const {combineReducers} = require('redux')

const self = util.createReducer(settingsManager.settings.uuid, {})
const babbling = util.createReducer(false, {
    'START_BABBLING_SELF': () => true,
    'STOP_BABBLING_SELF': () => false
})

function saveEditor(state) {
    let project = state.project
    const editor = state.editor.present

    switch (editor.type) {
    case 'puppet': {
        const characters = util.updateObject(state.project.characters, {
            [editor.id]: editor.character
        })
        const thumbnailPath = path.join(state.project.project, state.project.settings.charactersPath,
            '..', 'thumbnails', `new-${editor.id}`)
        ipcRenderer.send('background', 'generate thumbnails', thumbnailPath,
            editor.character, 'puppet', editor.id)
        project = util.updateObject(project, { characters })
        break
    }
    }
    
    return util.updateObject(state, {
        project,
        editor: util.updateObject(state.editor, {
            present: util.updateObject(state.editor.present, {
                oldCharacter: JSON.stringify(editor.character)
            })
        })
    })
}

const reducer = combineReducers({
    project,
    self,
    babbling,
    inspector,
    settings,
    status,
    editor: undoable(editor, {
        groupBy: groupByActionTypes(['EDIT_LAYER_POSITION', 'EDIT_LAYER_SCALE', 'ROTATE_LAYER']),
        filter: excludeAction('SET_LAYERS', 'EDIT_PUPPET')
    })
})

export default (state = {
    project: PROJECT_DEFAULTS,
    self: settingsManager.settings.uuid,
    babbling: false,
    inspector: INSPECTOR_DEFAULTS,
    settings: SETTINGS_DEFAULTS,
    status: STATUS_DEFAULTS,
    editor: EDITOR_DEFAULTS
}, action) => {
    if (action.type === 'SAVE_EDITOR')
        return saveEditor(state, action)
    return reducer(state, action)
}
