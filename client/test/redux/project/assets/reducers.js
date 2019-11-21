import chai, { expect } from 'chai'
import chaiRedux from 'chai-redux'
import thunk from 'redux-thunk'
import { combineReducers } from 'redux'
import mock from 'mock-require'
import fakeReducer from '../../../util/fakeReducer'
import fakeActions from '../../../util/fakeActions'

chai.use(chaiRedux)

let assets, getConflicts, setAssets
let reducer

const middleware = thunk

describe('redux/project/assets/reducers', function () {
    before(() => {
        mock('../../../../src/redux/project/folders', fakeActions('setFolders'))

        mock.reRequire('../../../util/mock-electron')
        const a = mock.reRequire('../../../../src/redux/project/assets/reducers')
        assets = a.default
        getConflicts = a.getConflicts
        setAssets = a.setAssets

        reducer = combineReducers({
            project: combineReducers({
                assets,
                folders: fakeReducer
            })
        })
    })

    after(mock.stopAll)

    it('should get conflicts', () => {
        const assets = {
            test: {
                type: 'bundle',
                layers: {
                    children: [
                        { head: true, emote: 2 }
                    ]
                }
            }
        }
        const layers = {
            children: [
                { id: 'test' },
                { emote: 1 }
            ]
        }

        const conflicts = getConflicts(assets, layers)
        expect(conflicts.head).to.be.true
        expect(conflicts.emoteLayer).to.be.false
        expect(conflicts.emotes).to.have.lengthOf(2).and.include(1).and.include(2)
    })

    it('should set assets', () => {
        const initialState = {
            project: {
                assets: {},
                folders: []
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(setAssets({ test: { tab: 'test' }, test2: { tab: 'test' } }))
        expect(store).to.have.state.like({
            project: {
                assets: {
                    test: { tab: 'test' },
                    test2: { tab: 'test' }
                },
                folders: []
            }
        }).and.dispatched({ f: 'setFolders', args: [['test']] })
    })
})
