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

let addCharacter, newCharacter, duplicateCharacter, deleteCharacter, changeCharacter
let reducer
let ipcRenderer

const project = path.join(__dirname, '..', '..', '..', 'test-data')
const charactersPath = path.join('characters', 'actions')

const middleware = thunk

describe('redux/project/characters/actions', function () {
    before(() => {
        mockElectron()
        ipcRenderer = require('electron').ipcRenderer
        mock('../../../../src/redux/status', fakeActions('warn'))
        mock('../../../../src/redux/inspector', fakeActions('close'))
        mock('../../../../src/redux/actors', {
            getActor: require('../../../../src/redux/actors').getActor,
            ...fakeActions('changePuppet')
        })
        mock('../../../../src/redux/editor/editor', fakeActions('close'))
        mock('../../../../src/redux/project/characterThumbnails', fakeActions('updateThumbnail', 'removeThumbnail'))
        mock('../../../../src/redux/project/settings/characters', fakeActions('addCharacter', 'removeCharacter'))
        mock('../../../../src/redux/project/project', fakeActions('setNumCharacters'))        
    })

    beforeEach(() => {
        const c = mock.reRequire('../../../../src/redux/project/characters/actions')
        addCharacter = c.addCharacter
        newCharacter = c.newCharacter
        duplicateCharacter = c.duplicateCharacter
        deleteCharacter = c.deleteCharacter
        changeCharacter = c.changeCharacter

        const characters = mock.reRequire('../../../../src/redux/project/characters/reducers').default
        reducer = combineReducers({
            project: combineReducers({
                numCharacters: fakeReducer,
                charactersPath: fakeReducer,
                settings: fakeReducer,
                characterThumbnails: fakeReducer,
                characters
            }),
            controller: fakeReducer,
            inspector: fakeReducer,
            editor: fakeReducer,
            actors: fakeReducer,
            defaults: fakeReducer,
            self: fakeReducer
        })
    })

    after(mock.stopAll)

    it('should add character', () => {
        const initialState = {
            project: {
                characters: {},
                numCharacters: 0,
                charactersPath
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(addCharacter(1, { name: 'test' }))
        const thumbnail = path.join(charactersPath, '..', 'thumbnails', 'new-1')
        expect(store).to.have.state.like({
            project: {
                ...store.getState().project,
                characters: {
                    1: { name: 'test' }
                }
            }
        })
        .and.dispatched({ f: 'setNumCharacters', args: [1] })
        .and.dispatched({ f: 'updateThumbnail', args: [1, 'puppet', thumbnail, false] })
        .and.dispatched({ f: 'addCharacter', args: [1] })
    })

    it('should create character', () => {
        const initialState = {
            project: {
                characters: {},
                numCharacters: 0,
                charactersPath,
                settings: {
                    nickname: 'testnick'
                }
            },
            defaults: {
                character: {
                    name: 'test'
                }
            },
            self: 'test-uuid'
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(newCharacter())
        expect(store).to.have.state.like({
            project: {
                ...store.getState().project,
                characters: {
                    1: {
                        name: 'test',
                        creator: 'test-uuid',
                        creatorNick: 'testnick',
                        oc: 'test-uuid',
                        ocNick: 'testnick'
                    }
                }
            }
        })
    })

    it('should duplicate character', () => {
        const initialState = {
            project: {
                characters: {
                    1: {
                        name: 'test'
                    }
                },
                numCharacters: 1,
                settings: {
                    nickname: 'testnick'
                },
                characterThumbnails: {
                    1: "1.png"
                },
                charactersPath
            },
            self: 'test-uuid'
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(duplicateCharacter(1))
        expect(store).to.have.state.like({
            project: {
                ...store.getState().project,
                characters: {
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

    it('should delete character', () => {
        const initialState = {
            project: {
                characters: {
                    1: {
                        name: 'test'
                    }
                }
            },
            controller: {
                actors: []
            },
            inspector: {},
            editor: {
                present: {}
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(deleteCharacter(1))
        expect(store).to.have.state.like({
            project: {
                ...store.getState().project,
                characters: {}
            }
        })
        .then.dispatched({ f: 'removeThumbnail', args: [1] })
        .then.dispatched({ f: 'removeCharacter', args: [1] })
        .not.dispatched({ f: 'close' })
    })

    it('should close inspector when deleting open character', () => {
        const initialState = {
            project: {
                characters: {
                    1: {
                        name: 'test'
                    }
                }
            },
            controller: {
                actors: []
            },
            inspector: { targetType: 'puppet', target: 1 },
            editor: {
                present: {}
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(deleteCharacter(1))
        expect(store).to.have.dispatched({ f: 'close' })
    })

    it('should close editor when deleting open character', () => {
        const initialState = {
            project: {
                characters: {
                    1: {
                        name: 'test'
                    }
                }
            },
            controller: {
                actors: []
            },
            inspector: {},
            editor: {
                present: { type: 'puppet', id: 1 }
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(deleteCharacter(1))
        expect(store).to.have.dispatched({ f: 'close' })
    })

    it('should warn if deleting active character', () => {
        const initialState = {
            project: {
                characters: {
                    1: {
                        name: 'test'
                    }
                }
            },
            controller: {
                actors: [0]
            },
            actors: [
                { id: 0, puppetId: 1 }
            ]
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(deleteCharacter(1))
        expect(store).to.have.dispatched({ f: 'warn' })
    })

    it('should change character', () => {
        const initialState = {
            project: {
                characters: {
                    1: { name: 'test', foo: 'bar' }
                },
                characterThumbnails: {
                    1: 'file:///fake/path/1.png'
                }
            },
            controller: {
                actors: [0]
            },
            actors: [
                { id: 0, puppetId: 1 }
            ]
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })
        let backgroundMessage
        ipcRenderer.on('background', (e, ...data) => {
            backgroundMessage = data
        })

        store.dispatch(changeCharacter(1, { name: 'updated' }))
        expect(store).to.have.state.like({
            project: {
                ...store.getState().project,
                characters: {
                    1: { name: 'updated', foo: 'bar' }
                }
            }
        })
        .then.dispatched({ f: 'changePuppet', args: [
            0,
            1,
            { name: 'updated', foo: 'bar' }
        ]})
        expect(backgroundMessage).to.eql([
            "generate thumbnails",
            'fake/path/new-1',
            { name: 'updated', foo: 'bar' },
            'puppet',
            1
        ])
        ipcRenderer.removeAllListeners('background')
    })

    it('should warn if accessing character that doesn\'t exist', () => {
        const initialState = {
            project: {
                characters: {}
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(duplicateCharacter(1))
        store.dispatch(deleteCharacter(1))
        store.dispatch(changeCharacter(1))
        expect(store).to.have.dispatched({ f: 'warn' })
            .then.dispatched({ f: 'warn' })
            .then.dispatched({ f: 'warn' })
            .not.then.dispatched({ f: 'warn' })
    })
})
