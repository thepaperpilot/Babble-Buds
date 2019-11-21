import chai, { expect } from 'chai'
import chaiRedux from 'chai-redux'
import thunk from 'redux-thunk'
import { combineReducers } from 'redux'
import environments, { setEnvironments } from '../../../../src/redux/project/environments/reducers'

chai.use(chaiRedux)

const reducer = combineReducers({
    project: combineReducers({
        environments
    })
})

const middleware = thunk

describe('redux/project/environments/reducers', function () {
    it('should set characters', () => {
        const initialState = {
            project: {
                environments: {}
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(setEnvironments({ test: { name: 'test' } }))
        expect(store).to.have.state.like({
            project: {
                environments: {
                    test: { name: 'test' }
                }
            }
        })
    })
})
