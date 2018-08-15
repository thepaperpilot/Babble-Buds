import undoable from 'redux-undo'
import util from './util'
import project from './project/project'
import inspector from './inspector/inspector'
import settings from './settings/settings'
import status from './status/status'
import editor from './editor/editor'

const settingsManager = window.require('electron').remote.require('./main-process/settings')

const {combineReducers} = require('redux')

const self = util.createReducer(settingsManager.settings.uuid, {})
const babbling = util.createReducer(false, {
    'START_BABBLING_SELF': () => true,
    'STOP_BABBLING_SELF': () => false
})

export default combineReducers({
    project,
    self,
    babbling,
    inspector,
    settings,
    status,
    editor
})
