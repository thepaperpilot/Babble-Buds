import '../../../util/mock-electron'
import { ipcRenderer } from 'electron'
import chai, { expect } from 'chai'
import chaiRedux from 'chai-redux'
import thunk from 'redux-thunk'
import { combineReducers } from 'redux'
import shortcuts, { setShortcuts, setShortcut }
    from '../../../../src/redux/project/settings/shortcuts'

chai.use(chaiRedux)

const reducer = combineReducers({
    project: combineReducers({
        settings: combineReducers({
            shortcuts
        })
    })
})

const defaultShortcuts = {
    'Select puppet 1': null,
    'Select puppet 2': null,
    'Select puppet 3': null,
    'Select puppet 4': null,
    'Select puppet 5': null,
    'Select puppet 6': null,
    'Select puppet 7': null,
    'Select puppet 8': null,
    'Select puppet 9': null,
    'Select environment 1': null,
    'Select environment 2': null,
    'Select environment 3': null,
    'Select environment 4': null,
    'Select environment 5': null,
    'Select environment 6': null,
    'Select environment 7': null,
    'Select environment 8': null,
    'Select environment 9': null,
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
}

const middleware = thunk

describe('redux/project/settings/shortcuts', function () {
    it('should set shortcuts', () => {
        const initialState = {
            project: {
                settings: {
                    shortcuts: defaultShortcuts
                }
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })
        let backgroundMessage
        ipcRenderer.on('global', (e, ...data) => {
            backgroundMessage = data
        })

        store.dispatch(setShortcuts({
            test: null,
            test2: 'ctrl+x'
        }))
        expect(store).to.have.state.like({
            project: {
                settings: {
                    shortcuts: {
                        ...store.getState().project.settings.shortcuts,
                        test: null,
                        test2: 'ctrl+x'
                    }
                }
            }
        })
        expect(backgroundMessage).to.have.lengthOf(2)
        expect(backgroundMessage[1].find(s => s.shortcut === 'test')).to.exist
        expect(backgroundMessage[1].find(s => s.shortcut === 'test2' && s.accel === 'ctrl+x')).to.exist
    })

    it('should set shortcut', () => {
        const initialState = {
            project: {
                settings: {
                    shortcuts: defaultShortcuts
                }
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })
        let backgroundMessage
        ipcRenderer.on('global', (e, ...data) => {
            backgroundMessage = data
        })

        store.dispatch(setShortcut('test3', 'y'))
        expect(store).to.have.state.like({
            project: {
                settings: {
                    shortcuts: {
                        ...store.getState().project.settings.shortcuts,
                        test3: 'y'
                    }
                }
            }
        })
        expect(backgroundMessage).to.have.lengthOf(2)
        expect(backgroundMessage[1]).to.eql([
            { accel: 'y', shortcut: 'test3' }
        ])
    })
})
