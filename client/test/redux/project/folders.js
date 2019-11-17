import chai, { expect } from 'chai'
import chaiRedux from 'chai-redux'
import thunk from 'redux-thunk'
import { combineReducers } from 'redux'
import mock from 'mock-require'
import fakeReducer from '../../util/fakeReducer'
import fakeActions from '../../util/fakeActions'

chai.use(chaiRedux)

let folders, setFolders, addFolder, removeFolder, moveFolder, renameFolder
let reducer

const middleware = thunk

const testAssets = {
    'test:testAsset1': { tab: 'test' },
    'test:testAsset2': { tab: 'test' },
    'test:testAsset3': { tab: 'test' }
}

const unownedAssets = {
    'fake:testAsset1': { tab: 'test' },
    'fake:testAsset2': { tab: 'test' },
    'fake:testAsset3': { tab: 'test' }
}

describe('redux/project/folders', function () {
    before(() => {
        mock('../../../src/redux/status', fakeActions('warn'))
        mock('../../../src/redux/project/assets/actions', fakeActions('moveAsset', 'deleteAssets'))

        const f = mock.reRequire('../../../src/redux/project/folders')
        folders = f.default
        setFolders = f.setFolders
        addFolder = f.addFolder
        removeFolder = f.removeFolder
        moveFolder = f.moveFolder
        renameFolder = f.renameFolder

        reducer = combineReducers({
            project: combineReducers({
                folders,
                assets: fakeReducer
            }),
            self: fakeReducer
        })
    })

    after(mock.stopAll)

    it("should set folders", () => {
        const initialState = {
            project: {
                folders: [ 'test' ]
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(setFolders([ 'other test', 'test2' ]))
        expect(store).to.have.state.like({
            project: {
                ...store.getState().project,
                folders: [ 'other test', 'test2' ]
            }
        })
    })

    it('should add folder', () => {
        const initialState = {
            project: {
                folders: [ 'test' ]
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(addFolder('testing'))
        expect(store).to.have.state.like({
            project: {
                ...store.getState().project,
                folders: [ 'test', 'testing' ]
            }
        })
    })

    it('should remove folder', () => {
        const initialState = {
            project: {
                folders: [ 'test' ]
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(removeFolder('test'))
        expect(store).to.have.state.like({
            project: {
                ...store.getState().project,
                folders: []
            }
        })
        .and.not.dispatched({ f: 'deleteAssets' })
    })

    it('should delete folder', () => {
        const initialState = {
            project: {
                folders: [ 'test' ],
                assets: testAssets
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(removeFolder('test', true))
        expect(store).to.have.dispatched({ f: 'deleteAssets', args: [ Object.keys(testAssets) ] })
            .then.state.like({
                project: {
                    ...store.getState().project,
                    folders: []
                }
            })
    })

    it('should move folder', () => {
        const initialState = {
            project: {
                folders: [ 'test', 'test2', 'test3' ]
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(moveFolder(1, 2))
        expect(store).to.have.state.like({
                project: {
                    ...store.getState().project,
                    folders: [ 'test', 'test3', 'test2' ]
                }
            })
    })

    it('should rename empty folder', () => {
        const initialState = {
            project: {
                folders: [ 'test' ],
                assets: {}
            },
            self: 'test'
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(renameFolder('test', 'test2'))
        expect(store).to.have.state.like({
                project: {
                    ...store.getState().project,
                    folders: [ 'test2' ]
                }
            })
    })

    it('should rename non-empty folder', () => {
        const initialState = {
            project: {
                folders: [ 'test' ],
                assets: testAssets
            },
            self: 'test'
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(renameFolder('test', 'test2'))
        const chain = expect(store).to.have
        Object.keys(testAssets).forEach(asset =>
            chain.then.dispatched({ f: 'moveAsset', args:[ asset, 'test2' ] }))
        chain.not.dispatched({ f: 'warn' })
    })

    it('should rename folder with unowned assets', () => {
        const initialState = {
            project: {
                folders: [ 'test' ],
                assets: unownedAssets
            },
            self: 'test'
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(renameFolder('test', 'test2'))
        expect(store).to.have.dispatched({ f: 'warn'})
            .then.have.state.like({
                project: {
                    ...store.getState().project,
                    folders: [ 'test', 'test2' ]
                }
            })
            .not.dispatched({ f: 'moveAsset' })
    })
})
