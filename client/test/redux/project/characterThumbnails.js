import chai, { expect } from 'chai'
import chaiRedux from 'chai-redux'
import thunk from 'redux-thunk'
import { combineReducers } from 'redux'
import mock from 'mock-require'
import fakeReducer from '../../util/fakeReducer'
import fakeActions from '../../util/fakeActions'

chai.use(chaiRedux)

let characterThumbnails, setThumbnails, removeThumbnail, updateThumbnail
let reducer

const middleware = thunk

describe('redux/project/characterThumbnails', function () {
    before(() => {
        mock('../../../src/redux/status', fakeActions('log'))

        const c = mock.reRequire('../../../src/redux/project/characterThumbnails')
        characterThumbnails = c.default
        setThumbnails = c.setThumbnails
        removeThumbnail = c.removeThumbnail
        updateThumbnail = c.updateThumbnail

        reducer = combineReducers({
            project: combineReducers({
                characterThumbnails,
                characters: fakeReducer
            })
        })
    })

    after(mock.stopAll)

    it("should set thumbnails", () => {        
        const initialState = {
            project: {
                characterThumbnails: {
                    test: 'something'
                }
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(setThumbnails({
            test2: 'updated'
        }))
        expect(store).to.have.state.like({
            project: {
                ...store.getState().project,
                characterThumbnails: {
                    test2: 'updated'
                }
            }
        })
    })

    it('should remove thumbnail', () => {        
        const initialState = {
            project: {
                characterThumbnails: {
                    test: 'something'
                }
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(removeThumbnail('test'))
        expect(store).to.have.state.like({
            project: {
                ...store.getState().project,
                characterThumbnails: {}
            }
        })
    })

    it('should update thumbnail', () => {        
        const initialState = {
            project: {
                characterThumbnails: {
                    test: 'something'
                },
                characters: {
                    test: { name: 'fake character' }
                }
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(updateThumbnail('test', 'puppet', 'fake/path'))
        expect(store.getState().project.characterThumbnails.test).to.have.string('file:///fake/path.png?random=')
            .and.lengthOf.above(30)
    })
})
