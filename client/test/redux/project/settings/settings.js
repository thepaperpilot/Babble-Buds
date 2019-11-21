import mockElectron from '../../../util/mock-electron'
import chai, { expect } from 'chai'
import chaiRedux from 'chai-redux'
import thunk from 'redux-thunk'
import { combineReducers } from 'redux'
import mock from 'mock-require'
import fakeActions from '../../../util/fakeActions'

chai.use(chaiRedux)

let settings, setSettings, setAlwaysOnTop
let reducer

const defaultHotbar = [1, 0, 0, 0, 0, 0, 0, 0, 0]
const updatedHotbar = [2, 0, 0, 0, 0, 0, 0, 0, 0]

const middleware = thunk

describe('redux/project/settings/settings', function () {
    before(() => {
        mockElectron()
        mock('../../../../src/redux/project/settings/characters',
            fakeActions('setCharacters'))
        mock('../../../../src/redux/project/settings/environments',
            fakeActions('setEnvironments'))
        mock('../../../../src/redux/project/settings/hotbar',
            fakeActions('setHotbar'))
        mock('../../../../src/redux/project/settings/networking',
            fakeActions('setNetworking'))
        mock('../../../../src/redux/project/settings/nickname',
            fakeActions('setNickname'))
        mock('../../../../src/redux/project/settings/shortcuts',
            fakeActions('setShortcuts'))


        const s = mock.reRequire('../../../../src/redux/project/settings/settings')
        settings = s.default
        setSettings = s.setSettings
        setAlwaysOnTop = s.setAlwaysOnTop

        reducer = combineReducers({
            project: combineReducers({
                settings
            })
        })
    })

    after(mock.stopAll)

    it("should set settings", () => {
        const initialState = {
            project: {
                settings: {}
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        const settings = {
            alwaysOnTop: true,
            charactersPath: '../test/characters',
            assetsPath: '../test/assets',
            characters: [ 'testCharacter' ],
            environments: [ 'testEnvironment' ],
            hotbar: [0,1,2,3,4,5,6,7,8,9],
            networking: { ip: 'ip', port: 'port', roomName: 'roomName', roomPassword: 'roomPassword' },
            nickname: 'testnick',
            shortcuts: { test: null }
        }

        store.dispatch(setSettings(settings))
        expect(store).to.have.state.like({
            project: {
                ...store.getState().project,
                settings: {
                    clientVersion: process.env.npm_package_version,
                    alwaysOnTop: settings.alwaysOnTop,
                    charactersPath: settings.charactersPath,
                    assetsPath: settings.assetsPath
                }
            }
        })
        .then.dispatched({ f: 'setCharacters', args: [ settings.characters ] })
        .then.dispatched({ f: 'setEnvironments', args: [ settings.environments ] })
        .then.dispatched({ f: 'setHotbar', args: [ settings.hotbar ] })
        .then.dispatched({ f: 'setNetworking', args: [ settings.networking ] })
        .then.dispatched({ f: 'setNickname', args: [ settings.nickname ] })
        .then.dispatched({ f: 'setShortcuts', args: [ settings.shortcuts ] })
    })

    it('should set always on top', () => {
        const initialState = {
            project: {
                settings: {
                    alwaysOnTop: false
                }
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(setAlwaysOnTop(true))
        expect(store).to.have.state.like({
            project: {
                settings: {
                    ...store.getState().project.settings,
                    alwaysOnTop: true
                }
            }
        })
    })
})
