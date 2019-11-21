import chai, { expect } from 'chai'
import chaiRedux from 'chai-redux'
import thunk from 'redux-thunk'
import { combineReducers } from 'redux'
import characters, { setCharacters, addCharacter, removeCharacter }
    from '../../../../src/redux/project/settings/characters'

chai.use(chaiRedux)

const reducer = combineReducers({
    project: combineReducers({
        settings: combineReducers({
            characters  
        })
    })
})

const middleware = thunk

describe('redux/project/settings/characters', function () {
    it('should set characters', () => {
        const initialState = {
            project: {
                settings: {
                    characters: []
                }
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(setCharacters([ { id: 1, location: '1.json' } ]))
        expect(store).to.have.state.like({
            project: {
                settings: {
                    characters: [
                        { id: 1, location: '1.json' }
                    ]
                }
            }
        })
    })

    it('should add character', () => {
        const initialState = {
            project: {
                settings: {
                    characters: []
                }
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(addCharacter(2))
        expect(store).to.have.state.like({
            project: {
                settings: {
                    characters: [
                        { id: 2, location: '2.json' }
                    ]
                }
            }
        })
    })

    it('should remove character', () => {
        const initialState = {
            project: {
                settings: {
                    characters: [
                        { id: 1, location: '1.json' }
                    ]
                }
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(removeCharacter(1))
        expect(store).to.have.state.like({
            project: {
                settings: {
                    characters: []
                }
            }
        })
    })
})
