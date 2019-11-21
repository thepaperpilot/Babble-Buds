import mockElectron from '../../../util/mock-electron'
import chai, { expect } from 'chai'
import chaiRedux from 'chai-redux'
import thunk from 'redux-thunk'
import { combineReducers } from 'redux'
import mock from 'mock-require'
import fakeReducer from '../../../util/fakeReducer'
import fakeActions from '../../../util/fakeActions'
import fs from 'fs-extra'
import path from 'path'

chai.use(chaiRedux)

let addEnvironment, newEnvironment, duplicateEnvironment, deleteEnvironment, changeEnvironment
let reducer
let ipcRenderer

const project = path.join(__dirname, '..', '..', '..', 'test-data')
const charactersPath = path.join('characters', 'actions')

const middleware = thunk

describe('redux/project/environments/actions', function () {
    before(() => {
        mockElectron()
        ipcRenderer = require('electron').ipcRenderer
        mock('../../../../src/redux/status', fakeActions('warn'))
        mock('../../../../src/redux/inspector', fakeActions('close'))
        mock('../../../../src/redux/environment', fakeActions('setEnvironment', 'setDefaultEnvironment'))
        mock('../../../../src/redux/editor/editor', fakeActions('close'))
        mock('../../../../src/redux/project/characterThumbnails', fakeActions('updateThumbnail', 'removeThumbnail'))
        mock('../../../../src/redux/project/settings/environments', fakeActions('addEnvironment', 'removeEnvironment'))
        mock('../../../../src/redux/project/project', fakeActions('setNumCharacters'))
    })

    beforeEach(() => {
        const e = mock.reRequire('../../../../src/redux/project/environments/actions')
        addEnvironment = e.addEnvironment
        newEnvironment = e.newEnvironment
        duplicateEnvironment = e.duplicateEnvironment
        deleteEnvironment = e.deleteEnvironment
        changeEnvironment = e.changeEnvironment

        const environments = mock.reRequire('../../../../src/redux/project/environments/reducers').default
        reducer = combineReducers({
            project: combineReducers({
                numCharacters: fakeReducer,
                charactersPath: fakeReducer,
                settings: fakeReducer,
                characterThumbnails: fakeReducer,
                environments
            }),
            inspector: fakeReducer,
            editor: fakeReducer,
            defaults: fakeReducer,
            environment: fakeReducer,
            self: fakeReducer
        })
    })

    after(mock.stopAll)

    it('should add environment', () => {
        const initialState = {
            project: {
                environments: {},
                numCharacters: 0,
                charactersPath,
                settings: {
                    nickname: 'testnick'
                }
            },
            defaults: {
                environment: {}
            },
            self: 'test-uuid'
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(addEnvironment(1, { name: 'test' }))
        const thumbnail = path.join(charactersPath, '..', 'thumbnails', 'new-1')
        expect(store).to.have.state.like({
            project: {
                ...store.getState().project,
                environments: {
                    1: { name: 'test' }
                }
            }
        })
        .and.dispatched({ f: 'setNumCharacters', args: [1] })
        .and.dispatched({ f: 'updateThumbnail', args: [1, 'environment', thumbnail] })
        .and.dispatched({ f: 'addEnvironment', args: [1] })
    })

    it('should create environment', () => {
        const initialState = {
            project: {
                environments: {},
                numCharacters: 0,
                charactersPath,
                settings: {
                    nickname: 'testnick'
                }
            },
            defaults: {
                environment: {}
            },
            self: 'test-uuid'
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(newEnvironment())
        expect(store).to.have.state.like({
            project: {
                ...store.getState().project,
                environments: {
                    1: {
                        name: 'New Environment',
                        creator: 'test-uuid',
                        creatorNick: 'testnick',
                        oc: 'test-uuid',
                        ocNick: 'testnick'
                    }
                }
            }
        })
    })

    it('should duplicate environment', () => {
        const initialState = {
            project: {
                environments: {
                    1: { name: 'test' }
                },
                characterThumbnails: {
                    1: 'file:///fake/path/1.png'
                },
                settings: {
                    nickname: 'testnick'
                },
                numCharacters: 1,
                charactersPath
            },
            inspector: {},
            editor: {
                present: {}
            },
            environment: {},
            self: 'test-uuid'
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(duplicateEnvironment(1))
        expect(store).to.have.state.like({
            project: {
                ...store.getState().project,
                environments: {
                    1: { name: 'test' },
                    2: {
                        name: 'test (copy)',
                        creator: 'test-uuid',
                        creatorNick: 'testnick'
                    }
                }
            }
        })
    })

    it('should delete environment', () => {
        const initialState = {
            project: {
                environments: {
                    1: { name: 'test', foo: 'bar' }
                },
                characterThumbnails: {
                    1: 'file:///fake/path/1.png'
                }
            },
            inspector: {},
            editor: {
                present: {}
            },
            environment: {},
            self: 'test-uuid'
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(deleteEnvironment(1))
        expect(store).to.have.state.like({
            project: {
                ...store.getState().project,
                environments: {}
            }
        })
        .then.dispatched({ f: 'removeThumbnail', args: [1] })
        .then.dispatched({ f: 'removeEnvironment', args: [1] })
        .not.dispatched({ f: 'close' })
    })

    it('should close inspector when deleting open environment', () => {
        const initialState = {
            project: {
                environments: {
                    1: { name: 'test', foo: 'bar' }
                },
                characterThumbnails: {
                    1: 'file:///fake/path/1.png'
                }
            },
            inspector: {
                targetType: "environment",
                target: 1
            },
            editor: {
                present: {}
            },
            environment: {},
            self: 'test-uuid'
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(deleteEnvironment(1))
        expect(store).to.have.dispatched({ f: 'close' })
    })

    it('should close editor when deleting open environment', () => {
        const initialState = {
            project: {
                environments: {
                    1: { name: 'test', foo: 'bar' }
                },
                characterThumbnails: {
                    1: 'file:///fake/path/1.png'
                }
            },
            inspector: {},
            editor: {
                present: {
                    type: "environment",
                    id: 1
                }
            },
            environment: {},
            self: 'test-uuid'
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(deleteEnvironment(1))
        expect(store).to.have.dispatched({ f: 'close' })
    })

    it('should return to default environment if deleting current environment', () => {
        const initialState = {
            project: {
                environments: {
                    1: { name: 'test', foo: 'bar' }
                },
                characterThumbnails: {
                    1: 'file:///fake/path/1.png'
                }
            },
            inspector: {},
            editor: {
                present: {}
            },
            environment: {
                setter: 'test-uuid',
                environmentId: 1
            },
            self: 'test-uuid'
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(deleteEnvironment(1))
        expect(store).to.have.dispatched({ f: 'setDefaultEnvironment' })
    })

    it('should change environment', () => {
        const initialState = {
            project: {
                environments: {
                    1: { name: 'test', foo: 'bar' }
                },
                characterThumbnails: {
                    1: 'file:///fake/path/1.png'
                }
            },
            environment: {
                setter: 'test-uuid',
                environmentId: 1
            },
            self: 'test-uuid'
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })
        let backgroundMessage
        ipcRenderer.on('background', (e, ...data) => {
            backgroundMessage = data
        })

        store.dispatch(changeEnvironment(1, { name: 'updated' }))
        expect(store).to.have.state.like({
            project: {
                ...store.getState().project,
                environments: {
                    1: { name: 'updated', foo: 'bar' }
                }
            }
        })
        expect(backgroundMessage).to.eql([
            "generate thumbnails",
            'fake/path/new-1',
            { name: 'updated', foo: 'bar' },
            'environment',
            1
        ])
        ipcRenderer.removeAllListeners('background')
    })

    it('should warn if accessing environment that doesn\'t exist', () => {
        const initialState = {
            project: {
                environments: {}
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(duplicateEnvironment(1))
        store.dispatch(deleteEnvironment(1))
        store.dispatch(changeEnvironment(1))
        expect(store).to.have.dispatched({ f: 'warn' })
            .then.dispatched({ f: 'warn' })
            .then.dispatched({ f: 'warn' })
            .not.then.dispatched({ f: 'warn' })
    })
})
