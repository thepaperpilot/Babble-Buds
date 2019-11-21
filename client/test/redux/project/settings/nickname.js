import chai, { expect } from 'chai'
import chaiRedux from 'chai-redux'
import thunk from 'redux-thunk'
import { combineReducers } from 'redux'
import nickname, { randomizeNickname, setNickname }
    from '../../../../src/redux/project/settings/nickname'
import names from '../../../../src/data/names.json'

chai.use(chaiRedux)

const reducer = combineReducers({
    project: combineReducers({
        settings: combineReducers({
            nickname
        })
    })
})

const middleware = thunk

describe('redux/project/settings/nickname', function () {
    it('should randomize nickname', () => {
        const initialState = {
            project: {
                settings: {
                    nickname: ''
                }
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(randomizeNickname())
        expect(store.getState().project.settings.nickname).to.be.oneOf(names)
    })

    it('should set nickname', () => {
        const initialState = {
            project: {
                settings: {
                    nickname: ''
                }
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(setNickname('testnick'))
        expect(store).to.have.state.like({
            project: {
                settings: {
                    nickname: 'testnick'
                }
            }
        })
    })
})
