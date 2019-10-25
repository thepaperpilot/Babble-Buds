import chai, { expect } from 'chai'
import chaiRedux from 'chai-redux'
import thunk from 'redux-thunk'
import { combineReducers } from 'redux'
import logFailedStore from '../util/logFailedStore'
import inspector, { inspect, close } from '../../src/redux/inspector'

chai.use(chaiRedux)

let store

describe('redux/inspector', () => {
    beforeEach(() => {
        store = chai.createReduxStore({ reducer: combineReducers({ inspector }), middleware: thunk })
    })

    afterEach(logFailedStore(() => store.getState()))

    it('should inspect', () => {
        store.dispatch(inspect('something', 'somethingType'))
        expect(store).to.have.state.like({
            inspector: {  target: 'something', targetType: 'somethingType' }
        })
    })

    it('should close', () => {
        store.dispatch(inspect('something', 'somethingType'))
        store.dispatch(close())
        
        expect(store).to.have.state({
            inspector: {  target: 'something', targetType: 'somethingType' }
        }).then.state({
            inspector: { target: null, targetType: null }
        })
    })
})
