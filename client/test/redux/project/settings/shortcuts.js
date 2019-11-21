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

const middleware = thunk

describe('redux/project/settings/shortcuts', function () {
    it('should set shortcuts', () => {
        const initialState = {
            project: {
                settings: {
                    shortcuts: {}   
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
        expect(backgroundMessage[1]).to.eql([
            { accel: null, shortcut: 'test' },
            { accel: 'ctrl+x', shortcut: 'test2' }
        ])
    })

    it('should set shortcut', () => {
        const initialState = {
            project: {
                settings: {
                    shortcuts: {}   
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
