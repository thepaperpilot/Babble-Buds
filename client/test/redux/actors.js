import chai, { expect } from 'chai'
import chaiRedux from 'chai-redux'
import thunk from 'redux-thunk'
import { combineReducers } from 'redux'
import mock from 'mock-require'
import fakeReducer from '../util/fakeReducer'
import fakeActions from '../util/fakeActions'

chai.use(chaiRedux)

let actors, getActor
let clearActors, addActor, removeActor, changePuppet, setEmote, moveLeft, moveRight, jiggle, setBabbling
let reducer

const middleware = thunk

function getBasicActor(id, {
        puppetId = 'test character', character = {}, emote = 0, babbling = false,
        jiggle = 0, position = 0, facingLeft = false
    } = {}) {
    return {
        id,
        puppetId,
        character,
        emote,
        babbling,
        jiggle,
        position,
        facingLeft
    }
}

describe('redux/actors', function () {
    before(() => {
        mock('../../src/redux/status',
            fakeActions('warn'))

        const a = require('../../src/redux/actors')
        actors = a.default
        getActor = a.getActor
        clearActors = a.clearActors
        addActor = a.addActor
        removeActor = a.removeActor
        changePuppet = a.changePuppet
        setEmote = a.setEmote
        moveLeft = a.moveLeft
        moveRight = a.moveRight
        jiggle = a.jiggle
        setBabbling = a.setBabbling

        reducer = combineReducers({
            actors,
            project: fakeReducer,
            environment: fakeReducer
        })
    })

    after(mock.stopAll)

    it("should get actor", () => {
        const initialState = {
            actors: [
                getBasicActor(1),
                getBasicActor(2),
                getBasicActor(3)
            ]
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        expect(getActor(store.getState(), 2)).eql(getBasicActor(2))
    })

    it("should clear actors", () => {
        const initialState = {
            actors: [
                getBasicActor(1),
                getBasicActor(2),
                getBasicActor(3)
            ]
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(clearActors())
        expect(store).to.have.state.like({ actors: [] })
    })

    it("should add empty actor", () => {
        const initialState = {
            actors: [],
            project: {
                assets: {}
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(addActor('test', 'test character', { layers: {} }))
        expect(store).to.have.state.like({
            actors: [
                getBasicActor('test', { character: { layers: {} } })
            ]
        })
    })

    it("should add non-empty actor", () => {
        const initialState = {
            actors: [],
            project: {
                assets: {
                    'test asset': {}
                }
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        const character = {
            layers: {
                children: [
                    {
                        id: 'test asset'
                    },
                    {
                        name: 'test emote',
                        id: 'test asset',
                        emote: 1
                    }
                ]
            }
        }
        store.dispatch(addActor('test', 'test character', character))
        expect(store).to.have.state.like({
            actors: [
                getBasicActor('test', { character, emote: 1 })
            ]
        })
    })

    it("should add non-empty actor with asset bundles", () => {
        const initialState = {
            actors: [],
            project: {
                assets: {
                    'test asset': {},
                    'test asset bundle': {
                        type: 'bundle',
                        layers: {
                            children: [
                                {
                                    name: 'test emote',
                                    id: 'test asset',
                                    emote: 1
                                }
                            ]
                        }
                    }
                }
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        const character = {
            layers: {
                children: [
                    {
                        id: 'test asset'
                    },
                    {
                        id: 'test asset bundle'
                    }
                ]
            }
        }
        store.dispatch(addActor('test', 'test character', character))
        expect(store).to.have.state.like({
            actors: [
                getBasicActor('test', { character, emote: 1 })
            ]
        })
    })

    it("should remove actor", () => {
        const initialState = {
            actors: [
                getBasicActor(1),
                getBasicActor(2),
                getBasicActor(3)
            ]
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(removeActor(2))
        expect(store).to.have.state.like({
            actors: [
                getBasicActor(1),
                getBasicActor(3)
            ]
        })
    })

    it("should change puppet", () => {
        const initialState = {
            actors: [
                getBasicActor(1),
                getBasicActor(2),
                getBasicActor(3)
            ]
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(changePuppet(2, 'test character 2',
            { name: 'new character' }))
        expect(store).to.have.state.like({
            actors: [
                getBasicActor(1),
                getBasicActor(2, {
                    puppetId: 'test character 2',
                    character: { name: 'new character' }
                }),
                getBasicActor(3)
            ]
        })
    })

    it("should set emote", () => {
        const initialState = {
            actors: [
                getBasicActor(1),
                getBasicActor(2, { emote: 1 }),
                getBasicActor(3)
            ]
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(setEmote(2, 3))
        expect(store).to.have.state.like({
            actors: [
                getBasicActor(1),
                getBasicActor(2, { emote: 3 }),
                getBasicActor(3)
            ]
        })
    })

    it("should move left when facing left", () => {
        const initialState = {
            actors: [
                getBasicActor(1),
                getBasicActor(2, { position: 3, facingLeft: true }),
                getBasicActor(3)
            ]
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(moveLeft(2))
        expect(store).to.have.state.like({
            actors: [
                getBasicActor(1),
                getBasicActor(2, { position: 2, facingLeft: true }),
                getBasicActor(3)
            ]
        })
    })

    it("should move left when facing right", () => {
        const initialState = {
            actors: [
                getBasicActor(1),
                getBasicActor(2, { position: 3 }),
                getBasicActor(3)
            ],
            environment: {
                numCharacters: 3
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(moveLeft(2))
        expect(store).to.have.state.like({
            actors: [
                getBasicActor(1),
                getBasicActor(2, { position: 3, facingLeft: true }),
                getBasicActor(3)
            ]
        })
    })

    it("should move left when facing right and on the edge", () => {
        const initialState = {
            actors: [
                getBasicActor(1),
                getBasicActor(2, { facingLeft: true }),
                getBasicActor(3)
            ],
            environment: {
                numCharacters: 3
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(moveLeft(2))
        expect(store).to.have.state.like({
            actors: [
                getBasicActor(1),
                getBasicActor(2, { position: -1, facingLeft: true }),
                getBasicActor(3)
            ]
        })
    })

    it("should move right when facing left", () => {
        const initialState = {
            actors: [
                getBasicActor(1),
                getBasicActor(2, { position: 3, facingLeft: true }),
                getBasicActor(3)
            ],
            environment: {
                numCharacters: 3
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(moveRight(2))
        expect(store).to.have.state.like({
            actors: [
                getBasicActor(1),
                getBasicActor(2, { position: 3 }),
                getBasicActor(3)
            ]
        })
    })

    it("should move right when facing right", () => {
        const initialState = {
            actors: [
                getBasicActor(1),
                getBasicActor(2, { position: 3 }),
                getBasicActor(3)
            ],
            environment: {
                numCharacters: 3
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(moveRight(2))
        expect(store).to.have.state.like({
            actors: [
                getBasicActor(1),
                getBasicActor(2, { position: 4 }),
                getBasicActor(3)
            ]
        })
    })

    it("should move left when facing right and on the edge", () => {
        const initialState = {
            actors: [
                getBasicActor(1),
                getBasicActor(2, { position: 4 }),
                getBasicActor(3)
            ],
            environment: {
                numCharacters: 3
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(moveLeft(2))
        expect(store).to.have.state.like({
            actors: [
                getBasicActor(1),
                getBasicActor(2, { position: 3, facingLeft: true }),
                getBasicActor(3)
            ]
        })
    })

    it("should jiggle", () => {
        const initialState = {
            actors: [
                getBasicActor(1),
                getBasicActor(2, { jiggle: 1 }),
                getBasicActor(3)
            ]
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(jiggle(1))
        store.dispatch(jiggle(2))
        expect(store).to.have.state.like({
            actors: [
                getBasicActor(1, { jiggle: 1 }),
                getBasicActor(2, { jiggle: 2 }),
                getBasicActor(3)
            ]
        })
    })

    it("should set babbling", () => {
        const initialState = {
            actors: [
                getBasicActor(1),
                getBasicActor(2, { babbling: true }),
                getBasicActor(3)
            ]
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(setBabbling(1, true))
        store.dispatch(setBabbling(2, false))
        expect(store).to.have.state.like({
            actors: [
                getBasicActor(1, { babbling: true }),
                getBasicActor(2),
                getBasicActor(3)
            ]
        })
    })

    it("should fail if using an id that doesn't exist", () => {
        const initialState = {
            actors: [
                getBasicActor(1)
            ]
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(removeActor(2))
        store.dispatch(changePuppet(2))
        store.dispatch(setEmote(2))
        store.dispatch(moveLeft(2))
        store.dispatch(moveRight(2))
        store.dispatch(jiggle(2))
        store.dispatch(setBabbling(2))
        expect(store.getState()).to.eql({
            actors: [
                getBasicActor(1)
            ],
            project: null,
            environment: null
        })
        expect(store).to.have
            .dispatched({ f: 'warn' })
            .then.dispatched({ f: 'warn' })
            .then.dispatched({ f: 'warn' })
            .then.dispatched({ f: 'warn' })
            .then.dispatched({ f: 'warn' })
            .then.dispatched({ f: 'warn' })
            .then.dispatched({ f: 'warn' })
            .not.then.dispatched({ f: 'warn' })
    })
})
