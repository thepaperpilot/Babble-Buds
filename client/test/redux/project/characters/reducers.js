import chai, { expect } from 'chai'
import chaiRedux from 'chai-redux'
import thunk from 'redux-thunk'
import { combineReducers } from 'redux'
import characters, { setCharacters } from '../../../../src/redux/project/characters/reducers'

chai.use(chaiRedux)

const reducer = combineReducers({
    project: combineReducers({
        characters
    })
})

const middleware = thunk

describe('redux/project/characters/reducers', function () {
    it('should set characters', () => {
        const initialState = {
            project: {
                characters: {}
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(setCharacters({ test: { name: 'test' } }))
        expect(store).to.have.state.like({
            project: {
                characters: {
                    test: { name: 'test' }
                }
            }
        })
    })
})
