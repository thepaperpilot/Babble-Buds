import chai, { expect } from 'chai'
import chaiRedux from 'chai-redux'
import thunk from 'redux-thunk'
import { combineReducers } from 'redux'
import mock from 'mock-require'
import fakeReducer from '../util/fakeReducer'
import fakeActions from '../util/fakeActions'

chai.use(chaiRedux)

let controller
let setActors, setEmote, moveLeft, moveRight, jiggle, changePuppet, changeEnvironment, setBabbling
let reducer

const middleware = thunk

describe('redux/controller', () => {
    before(() => {
        mock('../../src/redux/actors',
            fakeActions('setEmote', 'moveLeft', 'moveRight', 'jiggle',
                'changePuppet', 'setBabbling'))
        mock('../../src/redux/environment', fakeActions('setEnvironment', 'setDefaultEnvironment'))

        const c = mock.reRequire('../../src/redux/controller')
        controller = c.default
        setActors = c.setActors
        setEmote = c.setEmote
        moveLeft = c.moveLeft
        moveRight = c.moveRight
        jiggle = c.jiggle
        changePuppet = c.changePuppet
        changeEnvironment = c.changeEnvironment
        setBabbling = c.setBabbling

        reducer = combineReducers({
            controller,
            project: fakeReducer,
            self: fakeReducer
        })
    })

    after(mock.stopAll)

    it('should set actors', () => {
        const initialState = {
            controller: {
                actors: []
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(setActors([0]))
        expect(store).to.have.state.like({
            controller: {
                actors: [0],
                babbling: false
            }
        })
    })

    it('should set emote', () => {
        const initialState = {
            controller: {
                actors: [1, 2]
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(setEmote('emote'))
        expect(store).to.have
            .dispatched({ f: 'setEmote', args: [1, 'emote'] })
            .dispatched({ f: 'setEmote', args: [2, 'emote'] })
    })

    it('should move left', () => {
        const initialState = {
            controller: {
                actors: [1, 2]
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(moveLeft())
        expect(store).to.have
            .dispatched({ f: 'moveLeft', args: [1] })
            .dispatched({ f: 'moveLeft', args: [2] })
    })

    it('should move right', () => {
        const initialState = {
            controller: {
                actors: [1, 2]
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(moveRight())
        expect(store).to.have
            .dispatched({ f: 'moveRight', args: [1] })
            .dispatched({ f: 'moveRight', args: [2] })
    })

    it('should jiggle', () => {
        const initialState = {
            controller: {
                actors: [1, 2]
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(jiggle())
        expect(store).to.have
            .dispatched({ f: 'jiggle', args: [1] })
            .dispatched({ f: 'jiggle', args: [2] })
    })

    it('should set puppet from hotbar', () => {
        const initialState = {
            controller: {
                actors: [1, 2]
            },
            project: {
                settings: {
                    hotbar: [
                        'test'
                    ]
                },
                characters: {
                    test: 'test character'
                }
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(changePuppet(0))
        expect(store).to.have
            .dispatched({ f: 'changePuppet', args: [1, 'test', 'test character'] })
            .dispatched({ f: 'changePuppet', args: [2, 'test', 'test character'] })
    })

    it('should set puppet without hotbar', () => {
        const initialState = {
            controller: {
                actors: [1, 2]
            },
            project: {
                settings: {
                    hotbar: [
                        'test'
                    ]
                },
                characters: {
                    test: 'test character'
                }
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(changePuppet('test', true))
        expect(store).to.have
            .dispatched({ f: 'changePuppet', args: [1, 'test', 'test character'] })
            .dispatched({ f: 'changePuppet', args: [2, 'test', 'test character'] })
    })

    it('should set environment from hotbar', () => {
        const initialState = {
            project: {
                settings: {
                    environmentHotbar: [
                        'test'
                    ]
                },
                environments: {
                    test: 'test environment'
                }
            },
            self: 'testid'
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(changeEnvironment(0))
        expect(store).to.have
            .dispatched({ f: 'setEnvironment', args: ['testid', 'test', 'test environment'] })
    })

    it('should set environment to default from hotbar', () => {
        const initialState = {
            project: {
                settings: {
                    environmentHotbar: [
                        -1
                    ]
                },
                environments: {}
            },
            self: 'testid'
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(changeEnvironment(0))
        expect(store).to.have
            .dispatched({ f: 'setDefaultEnvironment' })
    })

    it('should set babbling', () => {
        const initialState = {
            controller: {
                actors: [1, 2],
                babbling: false
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(setBabbling(true))
        expect(store).to.have
            .dispatched({ f: 'setBabbling', args: [1, true] })
            .dispatched({ f: 'setBabbling', args: [2, true] })
            .state.like({
                controller: {
                    actors: [1, 2],
                    babbling: true
                }
            })
    })
})
