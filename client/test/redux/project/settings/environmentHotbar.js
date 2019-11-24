import chai, { expect } from 'chai'
import chaiRedux from 'chai-redux'
import thunk from 'redux-thunk'
import { combineReducers } from 'redux'
import mock from 'mock-require'
import fakeReducer from '../../../util/fakeReducer'
import fakeActions from '../../../util/fakeActions'

chai.use(chaiRedux)

let environmentHotbar, setHotbar, setSlot
let reducer

const defaultHotbar = [1, 0, 0, 0, 0, 0, 0, 0, 0]
const updatedHotbar = [2, 0, 0, 0, 0, 0, 0, 0, 0]

const middleware = thunk

describe('redux/project/settings/environmentHotbar', function () {
    before(() => {
        mock('../../../../src/redux/environment', fakeActions('setEnvironment'))

        const h = mock.reRequire('../../../../src/redux/project/settings/environmentHotbar')
        environmentHotbar = h.default
        setHotbar = h.setHotbar
        setSlot = h.setSlot

        reducer = combineReducers({
            project: combineReducers({
                settings: combineReducers({
                    environmentHotbar
                }),
                environments: fakeReducer
            }),
            environment: fakeReducer,
            self: fakeReducer
        })
    })

    after(mock.stopAll)

    it("should set environmentHotbar", () => {
        const initialState = {
            project: {
                settings: {
                    environmentHotbar: defaultHotbar
                },
                environments: {
                    2: "test environment"
                }
            },
            environment: {
                setter: 'testid',
                environmentId: defaultHotbar[0]
            },
            self: 'testid'
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(setHotbar(updatedHotbar))
        expect(store).to.have.state.like({
            project: {
                ...store.getState().project,
                settings: {
                    environmentHotbar: updatedHotbar
                }
            }
        })
        .and.dispatched({ f: 'setEnvironment', args: [
            'testid',
            2,
            "test environment"
        ] })
    })

    it('should set slot', () => {
        const initialState = {
            project: {
                settings: {
                    environmentHotbar: defaultHotbar
                },
                environments: {
                    2: "other environment"
                }
            },
            environment: {
                setter: 'testid',
                environmentId: defaultHotbar[0]
            },
            self: 'testid'
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(setSlot(0, 2))
        expect(store).to.have.state.like({
            project: {
                ...store.getState().project,
                settings: {
                    environmentHotbar: updatedHotbar
                }
            }
        })
        .and.dispatched({ f: 'setEnvironment', args: [
            'testid',
            2,
            "other environment"
        ] })
    })

    it('should set slot without changing the environment', () => {
        const initialState = {
            project: {
                settings: {
                    environmentHotbar: defaultHotbar
                },
                environments: {
                    2: "test puppet"
                }
            },
            environment: {

            },
            self: 'testid'
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(setSlot(0, 2))
        expect(store).to.have.state.like({
            project: {
                ...store.getState().project,
                settings: {
                    environmentHotbar: updatedHotbar
                }
            }
        })
        .and.not.dispatched({ f: 'setEnvironment' })
    })
})
