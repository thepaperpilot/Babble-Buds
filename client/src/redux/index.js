import { combineReducers } from 'redux'
import util from './util'
import project from './project/project'
import inspector from './inspector'
import settings from './settings'
import status from './status'
import editor from './editor/editor'
import actors from './actors'
import controller from './controller'
import environment from './environment'
import networking from './networking'
import defaults from './defaults'

const remote = window.require('electron').remote
const settingsManager = remote.require('./main-process/settings')
const self = util.createReducer(settingsManager.settings.uuid, {})

export default combineReducers({
    project,
    self,
    inspector,
    settings,
    status,
    editor,
    actors,
    environment,
    controller,
    networking,
    defaults
})
