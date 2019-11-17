import chai, { expect } from 'chai'
import chaiRedux from 'chai-redux'
import thunk from 'redux-thunk'
import { combineReducers } from 'redux'
import dirtyCharacters, { addCharacters, clearCharacters } from '../../../src/redux/project/dirtyCharacters'

chai.use(chaiRedux)

const reducer = combineReducers({
    project: combineReducers({
        dirtyCharacters
    })
})

const middleware = thunk

describe('redux/project/dirtyCharacters', function () {
    it("should add characters", () => {
        const initialState = {
            project: {
                dirtyCharacters: []
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        const characterThumbnails = [
            'test',
            'test2',
            'test3'
        ]
        store.dispatch(addCharacters(characterThumbnails))
        expect(store).to.have.state.like({
            project: {
                ...store.getState().project,
                dirtyCharacters: characterThumbnails
            }
        })
    })

    it('should clear characters', () => {
        const initialState = {
            project: {
                dirtyCharacters: [
                    'test'
                ]
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(clearCharacters())
        expect(store).to.have.state.like({
            project: {
                ...store.getState().project,
                dirtyCharacters: []
            }
        })
    })
})
