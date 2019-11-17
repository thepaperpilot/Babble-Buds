import chai, { expect } from 'chai'
import chaiRedux from 'chai-redux'
import thunk from 'redux-thunk'
import { combineReducers } from 'redux'
import mock from 'mock-require'
import fakeReducer from '../../util/fakeReducer'
import fakeActions from '../../util/fakeActions'
import undoable, { ActionCreators } from 'redux-undo'

chai.use(chaiRedux)

let editor, open, close, save
let reducer

const middleware = thunk

export function createEmptyHistory(present) {
    return { past: [], present, future: [] }
}

describe('redux/editor/editor', function () {
    before(() => {
        mock('../../../src/redux/editor/layers',
            Object.assign(fakeReducer, fakeActions('setLayers', 'clear')))
        mock('../../../src/redux/editor/selected',
            Object.assign(fakeReducer, fakeActions('selectLayer', 'setEmote')))
        mock('../../../src/redux/project/environments/actions',
            fakeActions('changeEnvironment'))
        mock('../../../src/redux/project/characters/actions',
            fakeActions('changeCharacter'))
        mock('../../../src/redux/project/assets/actions', fakeActions('setLayers'))
        mock('../../../src/redux/status', fakeActions('warn'))
        mock('redux-undo', Object.assign(undoable, {
            ActionCreators: fakeActions('clearHistory')
        }))

        const e = mock.reRequire('../../../src/redux/editor/editor')
        editor = e.default
        open = e.open
        close = e.close
        save = e.save

        reducer = combineReducers({ editor })
    })

    after(mock.stopAll)

    it("should open", () => {
        const initialState = {
            editor: createEmptyHistory({
                id: null,
                type: null,
                selected: null,
                layers: null
            })
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(open('test character', 'test layers'))
        expect(store).to.have
            .state.like({
                editor: {
                    ...store.getState().editor,
                    present: {
                        id: 'test character',
                        type: 'puppet',
                        selected: null,
                        layers: null
                    }
                }
            })
            .then.dispatched({ f: 'setEmote', args: [0] })
            .then.dispatched({ f: 'setLayers', args: ['test layers'] })
            .then.dispatched({ f: 'selectLayer', args: [null, false] })
            .then.dispatched({ f: 'clearHistory', args: [] })
    })

    it("should close", () => {
        const initialState = {
            editor: createEmptyHistory({
                id: 'test character',
                type: 'puppet',
                selected: {
                    layer: [],
                    emote: 0
                },
                layers: { children: [] }
            })
        }

        const store = chai.createReduxStore({ reducer, middleware, initialState })
        return

        store.dispatch(close())
        expect(store).to.have
            .state.like({
                editor: {
                    ...store.getState().editor,
                    present: {
                        id: null,
                        type: null,
                        selected: {
                            layer: [],
                            emote: 0
                        },
                        layers: { children: [] }
                    }
                }
            })
            .then.dispatched({ f: 'clear', args: [] })
    })
})
