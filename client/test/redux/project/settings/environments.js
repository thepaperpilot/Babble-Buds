import chai, { expect } from 'chai'
import chaiRedux from 'chai-redux'
import thunk from 'redux-thunk'
import { combineReducers } from 'redux'
import environments, { setEnvironments, addEnvironment, removeEnvironment }
    from '../../../../src/redux/project/settings/environments'

chai.use(chaiRedux)

const reducer = combineReducers({
    project: combineReducers({
        settings: combineReducers({
            environments  
        })
    })
})

const middleware = thunk

describe('redux/project/settings/environments', function () {
    it('should set environments', () => {
        const initialState = {
            project: {
                settings: {
                    environments: []
                }
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(setEnvironments([ { id: 1, location: '1.json' } ]))
        expect(store).to.have.state.like({
            project: {
                settings: {
                    environments: [
                        { id: 1, location: '1.json' }
                    ]
                }
            }
        })
    })

    it('should add environment', () => {
        const initialState = {
            project: {
                settings: {
                    environments: []
                }
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(addEnvironment(2))
        expect(store).to.have.state.like({
            project: {
                settings: {
                    environments: [
                        { id: 2, location: '2.json' }
                    ]
                }
            }
        })
    })

    it('should remove environment', () => {
        const initialState = {
            project: {
                settings: {
                    environments: [
                        { id: 1, location: '1.json' }
                    ]
                }
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(removeEnvironment(1))
        expect(store).to.have.state.like({
            project: {
                settings: {
                    environments: []
                }
            }
        })
    })
})
