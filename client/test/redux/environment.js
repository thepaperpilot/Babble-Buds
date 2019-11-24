import chai, { expect } from 'chai'
import chaiRedux from 'chai-redux'
import thunk from 'redux-thunk'
import { combineReducers } from 'redux'
import fakeReducer from '../util/fakeReducer'
import environment, { setEnvironment, setDefaultEnvironment } from '../../src/redux/environment'

chai.use(chaiRedux)

let store
const reducer = combineReducers({
    environment,
    defaults: fakeReducer,
    self: fakeReducer
})
const initialState = {
    environment: null,
    defaults: {
        environment: {
            name: 'fake default environment',
            foo: 'bar'
        }
    },
    self: 'fake setter'
}
const middleware = thunk

describe('redux/environment', function () {
    beforeEach(() => {
        store = chai.createReduxStore({ reducer, middleware, initialState })
    })

    it("should set environment", () => {
        store.dispatch(setEnvironment('fake setter', 'fake environment id', {
            name: 'fake environment',
            foo: 'bar'
        }))
        expect(store).to.have.state.like({
            environment: {
                name: 'fake environment',
                foo: 'bar',
                setter: 'fake setter',
                environmentId: 'fake environment id'
            }
        })
    })

    it("should set default environment", () => {
        store.dispatch(setDefaultEnvironment())
        expect(store).to.have.state.like({
            environment: {
                name: 'fake default environment',
                foo: 'bar',
                setter: 'fake setter',
                environmentId: -1
            }
        })
    })

    it("should ignore reserved properties in environment", () => {
        store.dispatch(setEnvironment('fake setter', 'fake environment id', {
            name: 'fake environment',
            foo: 'bar',
            setter: 'reserved'
        }))
        expect(store).to.have.state.like({
            environment: {
                name: 'fake environment',
                foo: 'bar',
                setter: 'fake setter',
                environmentId: 'fake environment id'
            }
        })
    })
})
