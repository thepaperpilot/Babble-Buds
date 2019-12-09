import chai, { expect } from 'chai'
import chaiRedux from 'chai-redux'
import thunk from 'redux-thunk'
import { combineReducers } from 'redux'
import mock from 'mock-require'
import fakeReducer from '../../../util/fakeReducer'
import fakeActions from '../../../util/fakeActions'
import { getActor } from '../../../../src/redux/actors'

chai.use(chaiRedux)

let hotbar, setHotbar, setSlot
let reducer

const defaultHotbar = [1, 0, 0, 0, 0, 0, 0, 0, 0]
const updatedHotbar = [2, 0, 0, 0, 0, 0, 0, 0, 0]

const middleware = thunk

describe('redux/project/settings/hotbar', function () {
    before(() => {
        mock('../../../../src/redux/actors', {
            ...fakeActions('changePuppet'),
            getActor
        })

        const h = mock.reRequire('../../../../src/redux/project/settings/hotbar')
        hotbar = h.default
        setHotbar = h.setHotbar
        setSlot = h.setSlot

        reducer = combineReducers({
            project: combineReducers({
                settings: combineReducers({
                    hotbar
                }),
                characters: fakeReducer
            }),
            controller: fakeReducer,
            actors: fakeReducer
        })
    })

    after(mock.stopAll)

    it("should set hotbar", () => {
        const initialState = {
            project: {
                settings: {
                    hotbar: defaultHotbar
                },
                characters: {
                    2: "test puppet"
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

        store.dispatch(setHotbar(updatedHotbar))
        expect(store).to.have.state.like({
            project: {
                ...store.getState().project,
                settings: {
                    hotbar: updatedHotbar
                }
            }
        })
        .and.then.dispatched({ f: 'changePuppet', args: [
            0,
            2,
            "test puppet"
        ]})
    })

    it('should set slot', () => {
        const initialState = {
            project: {
                settings: {
                    hotbar: defaultHotbar
                },
                characters: {
                    2: "test puppet"
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

        store.dispatch(setSlot(0, 2))
        expect(store).to.have.state.like({
            project: {
                ...store.getState().project,
                settings: {
                    hotbar: updatedHotbar
                }
            }
        })
        .and.then.dispatched({ f: 'changePuppet', args: [
            0,
            2,
            "test puppet"
        ]})
    })

    it('should set inactive slot', () => {
        const initialState = {
            project: {
                settings: {
                    hotbar: defaultHotbar
                },
                characters: {
                    2: "test puppet"
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

        store.dispatch(setSlot(1, 2))
        expect(store).to.have.state.like({
            project: {
                ...store.getState().project,
                settings: {
                    hotbar: [1, 2, 0, 0, 0, 0, 0, 0, 0]
                }
            }
        })
        .and.then.not.dispatched({ f: 'changePuppet' })
    })
})
