import '../../util/mock-electron'
import chai, { expect } from 'chai'
import chaiRedux from 'chai-redux'
import thunk from 'redux-thunk'
import { combineReducers } from 'redux'
import mock from 'mock-require'
import fakeReducer from '../../util/fakeReducer'
import fakeActions from '../../util/fakeActions'
import path from 'path'
import fs from 'fs-extra'

chai.use(chaiRedux)

let project, close, load, setNumCharacters
let reducer
let ipcRenderer

let dialog

const middleware = thunk

const projectPath = path.join(__dirname, '..', '..', 'test-data', 'project')

const defaults = {
    settings: {
        'clientVersion': process.env.npm_package_version,
        'alwaysOnTop': false,
        'networking': {
            'ip': 'babblebuds.xyz',
            'port': 8080,
            'roomName': 'lobby',
            'roomPassword': '',
        },
        'nickname': 'testnick',
        'charactersPath': '../characters',
        'assetsPath': '../assets',
        'characters': [],
        'environments': [],
        'hotbar': [0,0,0,0,0,0,0,0,0],
        'environmentHotbar': [0,0,0,0,0,0,0,0,0],
        'shortcuts': {
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
            'Jiggle': null,
        },
        'folders': []
    }
}

describe('redux/project/project', function () {
    before(() => {
        mock.reRequire('../../util/mock-electron')
        ipcRenderer = mock.reRequire('electron').ipcRenderer
        dialog = mock.reRequire('electron').remote.dialog
        mock('../../../src/redux/project/folders', fakeActions('load'))
        mock('../../../src/redux/project/settings/settings', fakeActions('setSettings'))
        mock('../../../src/redux/project/characters/reducers', fakeActions('setCharacters'))
        mock('../../../src/redux/project/environments/reducers', fakeActions('setEnvironments'))
        mock('../../../src/redux/project/assets/reducers', fakeActions('setAssets'))
        mock('../../../src/redux/project/characterThumbnails', fakeActions('setThumbnails'))
        mock('../../../src/redux/project/dirtyCharacters', fakeActions('addCharacters', 'clearCharacters'))
        mock('../../../src/redux/environment', fakeActions('setEnvironment', 'setDefaultEnvironment'))
        mock('../../../src/redux/networking', fakeActions('setSinglePlayer'))
        mock('../../../src/redux/actors', fakeActions('clearActors'))
        mock('../../../src/redux/controller', fakeActions('setActors'))
        mock('../../../src/redux/status', fakeActions('warn'))

        const p = mock.reRequire('../../../src/redux/project/project')
        project = p.default
        close = p.close
        load = p.load
        setNumCharacters = p.setNumCharacters

        reducer = combineReducers({
            project,
            defaults: fakeReducer
        })
    })

    beforeEach(() => dialog.reset())

    after(mock.stopAll)

    it("should close", () => {
        const initialState = {
            defaults: {
                settings: 'dummy settings'
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(close())
        expect(store).to.have.state.like({
            project: {
                ...store.getState().project,
                project: null
            }
        })
        .then.dispatched({ f: 'setSettings', args: ['dummy settings'] })
        .then.dispatched({ f: 'setCharacters', args: [] })
        .then.dispatched({ f: 'setEnvironments', args: [] })
        .then.dispatched({ f: 'setThumbnails', args: [] })
        .then.dispatched({ f: 'clearCharacters', args: [] })
        .then.dispatched({ f: 'setAssets', args: [] })
        .then.dispatched({ f: 'clearActors', args: [] })
        .then.dispatched({ f: 'setActors', args: [] })
    })

    it('should load empty project', () => {
        const initialState = {
            defaults
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(load(path.join(projectPath, 'empty.babble')))
        expect(store).to.have.dispatched({
            f: 'setSettings',
            args: [Object.assign({}, defaults.settings, fs.readJsonSync(path.join(projectPath, 'empty.babble')))]
        })
        expect(dialog.hasBeenCalled).to.be.false
    })

    it('should warn if loading non-exist file', () => {
        const initialState = {
            defaults
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(load(path.join(projectPath, 'doesn\'t exist.babble')))
        expect(store).to.have.dispatched({ f: 'warn' })
    })

    it('should warn if loading non-JSON file', () => {
        const initialState = {
            defaults
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(load(path.join(projectPath, 'invalid.babble')))
        expect(store).to.have.dispatched({ f: 'warn' })
    })

    it('should load', () => {
        const initialState = {
            defaults
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        const filepath = path.join(projectPath, 'project.babble')
        store.dispatch(load(filepath))
        expect(store).to.have.state.like({
            project: {
                ...store.getState().project,
                project: filepath
            }
        }).and.dispatched({
            f: 'setSettings',
            args: [Object.assign({}, defaults.settings, fs.readJsonSync(filepath))]
        })
        expect(dialog.hasBeenCalled).to.be.true
    })

    it('should set legacy environment when loading', () => {
        const initialState = {
            defaults
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })
        let backgroundMessage
        ipcRenderer.on('background', (e, ...data) => {
            backgroundMessage = data
        })

        const filepath = path.join(projectPath, 'legacy.babble')
        store.dispatch(load(filepath))
        expect(store).to.have.state.like({
            project: {
                ...store.getState().project,
                project: filepath
            }
        })
        expect(store.__history.find(h => h.action.f === 'setSettings').action.args[0].environments)
            .to.have.lengthOf(1)
        expect(backgroundMessage).to.eql([
            'generate thumbnails',
            path.join(filepath, '..', 'thumbnails', '1'),
            {
                name: 'Legacy',
                color: '#000000',
                numCharacters: 3,
                puppetScale: 1.2
            },
            'environment',
            1
        ])
    })

    it('should warn if loadCharacters returned errors', () => {
        const initialState = {
            defaults
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(load(path.join(projectPath,
            'invalid-characters.babble')))
        expect(store).to.have.dispatched({ f: 'warn' })
            .then.dispatched({ f: 'warn' })
            .not.then.dispatched({ f: 'warn' })
    })

    it('should warn if loadAssets returned errors', () => {
        const initialState = {
            defaults
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(load(path.join(projectPath,
            'invalid-assets.babble')))
        expect(store).to.have.dispatched({ f: 'warn' })
            .not.then.dispatched({ f: 'warn' })
    })

    it('should set numCharacters', () => {
        const initialState = {
            project: {
                numCharacters: 2
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(setNumCharacters(3))
        expect(store).to.have.state.like({
            project: {
                ...store.getState().project,
                numCharacters: 3
            }
        })
    })
})
