import chai, { expect } from 'chai'
import chaiRedux from 'chai-redux'
import thunk from 'redux-thunk'
import { combineReducers } from 'redux'
import mock from 'mock-require'
import fakeReducer from '../util/fakeReducer'
import fakeActions from '../util/fakeActions'
import disableTimeouts from '../util/disableTimeouts'

chai.use(chaiRedux)

let networking, setSinglePlayer
let reducer

const middleware = thunk

describe('redux/networking', function () {
    before(() => {
        mock('../../src/redux/actors',
            fakeActions('addActor', 'removeActor', 'moveRight'))
        mock('../../src/redux/controller', fakeActions('setActors'))
        mock('../../src/redux/environment',
            fakeActions('setEnvironment', 'setDefaultEnvironment'))
        disableTimeouts()

        const n = mock.reRequire('../../src/redux/networking')
        networking = n.default
        setSinglePlayer = n.setSinglePlayer

        reducer = combineReducers({
            networking,
            controller: fakeReducer,
            environment: fakeReducer,
            actors: fakeReducer,
            project: fakeReducer,
            self: fakeReducer
        })
    })

    after(() => {
        mock.stopAll()
        disableTimeouts.stop()
    })

    it("should set single player with no actors", done => {
        const initialState = {
            controller: {
                actors: []
            },
            actors: [],
            project: {
                characters: {
                    test: 'not a real puppet'
                },
                settings: {
                    hotbar: [
                        'test'
                    ],
                    environmentHotbar: []
                }
            },
            environment: {}
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(setSinglePlayer())
        expect(store).to.have
            .dispatched({ f: 'addActor', args: [0, 'test', 'not a real puppet'] })
            .then.dispatched({ f: 'setActors', args: [[0]] })
            .then.eventually.have.dispatched({ f: 'moveRight', args: [0] })
            .notify(done)
    })

    it("should set single player with only non-controlled actors", done => {
        const initialState = {
            controller: {
                actors: []
            },
            actors: [ { id: 'fake id' } ],
            project: {
                characters: {
                    test: 'not a real puppet'
                },
                settings: {
                    hotbar: [
                        'test'
                    ],
                    environmentHotbar: []
                }
            },
            environment: {}
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(setSinglePlayer())
        expect(store).to.have
            .dispatched({ f: 'removeActor', args: ['fake id'] })
            .dispatched({ f: 'addActor', args: [0, 'test', 'not a real puppet'] })
            .then.dispatched({ f: 'setActors', args: [[0]] })
            .then.eventually.have.dispatched({ f: 'moveRight', args: [0] })
            .notify(done)
    })

    it("should do nothing if set to single player with only controlled actors", () => {
        const initialState = {
            controller: {
                actors: [ 'fake id' ]
            },
            actors: [ { id: 'fake id' } ],
            project: {
                characters: {
                    test: 'not a real puppet'
                },
                settings: {
                    hotbar: [
                        'test'
                    ],
                    environmentHotbar: []
                }
            },
            environment: {}
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(setSinglePlayer())
        expect(store).not.have.dispatched({ f: 'removeActor' })
            .and.dispatched({ f: 'addActor' })
            .and.dispatched({ f: 'setActors' })
    })

    it("should set single player with both controlled and non-controlled actors", () => {
        const initialState = {
            controller: {
                actors: [ 'fake id' ]
            },
            actors: [ { id: 'fake id' }, { id: 'other fake id'} ],
            project: {
                characters: {
                    test: 'not a real puppet'
                },
                settings: {
                    hotbar: [
                        'test'
                    ],
                    environmentHotbar: []
                }
            },
            environment: {}
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(setSinglePlayer())
        expect(store).to.have
            .dispatched({ f: 'removeActor', args: ['other fake id'] })
    })

    it("should set single player with the active environment", () => {
        const initialState = {
            controller: {
                actors: []
            },
            actors: [],
            project: {
                characters: {},
                environments: {
                    2: 'test environment'
                },
                settings: {
                    hotbar: [
                        'test'
                    ],
                    environmentHotbar: []
                }
            },
            environment: {
                setter: 'testid',
                environmentId: 2
            },
            self: 'testid'
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(setSinglePlayer())
        expect(store).to.not.have.dispatched({ f: 'setDefaultEnvironment' })
            .and.dispatched({ f: 'setEnvironment' })
    })

    it("should set single player with no environments", () => {
        const initialState = {
            controller: {
                actors: []
            },
            actors: [],
            project: {
                characters: {},
                settings: {
                    hotbar: [
                        'test'
                    ],
                    environmentHotbar: []
                }
            },
            environment: {},
            self: 'testid'
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(setSinglePlayer())
        expect(store).to.have.dispatched({ f: 'setDefaultEnvironment' })
    })

    it("should set single player with an environment", () => {
        const initialState = {
            controller: {
                actors: []
            },
            actors: [],
            project: {
                characters: {},
                environments: {
                    1: 'test environment'
                },
                settings: {
                    hotbar: [
                        'test'
                    ],
                    environmentHotbar: [1]
                }
            },
            environment: {},
            self: 'testid'
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(setSinglePlayer())
        expect(store).to.have.dispatched({ f: 'setEnvironment', args: ['testid', 1, 'test environment'] })
    })
})
