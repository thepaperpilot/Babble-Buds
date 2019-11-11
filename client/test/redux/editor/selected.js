import chai, { expect } from 'chai'
import chaiRedux from 'chai-redux'
import thunk from 'redux-thunk'
import { combineReducers } from 'redux'
import mock from 'mock-require'
import { createEmptyHistory } from './editor'
import fakeReducer from '../../util/fakeReducer'
import fakeActions from '../../util/fakeActions'
import undoable, { ActionCreators } from 'redux-undo'

chai.use(chaiRedux)

let store, selected, setEmote, selectLayer
let reducer

const middleware = thunk

describe('redux/editor/selected', function () {
    before(() => {
        mock('../../../src/redux/status', fakeActions('warn'))
        mock('../../../src/redux/inspector', fakeActions('inspect'))

        const s = require('../../../src/redux/editor/selected')
        selected = s.default
        setEmote = s.setEmote
        selectLayer = s.selectLayer

        reducer = combineReducers({
            editor: undoable(combineReducers({
                selected,
                layers: fakeReducer
            })),
            project: fakeReducer
        })
    })

    after(mock.stopAll)

    it("should set emote", () => {
        const initialState = {
            editor: createEmptyHistory({
                selected: {
                    emote: 0,
                    layer: null
                }
            })
        }
        store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(setEmote(2))
        expect(store).to.have
            .state.like({
                editor: {
                    ...store.getState().editor,
                    present: {
                        selected: {
                            emote: 2,
                            layer: null
                        },
                        layers: null
                    }
                }
            })
    })

    it("should select empty layer", () => {
        const initialState = {
            editor: createEmptyHistory({
                selected: {
                    emote: 0,
                    layer: [0, 0, 2]
                }
            })
        }
        store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(selectLayer())
        expect(store).to.have
            .state.like({
                editor: {
                    ...store.getState().editor,
                    present: {
                        selected: {
                            emote: 0,
                            layer: []
                        },
                        layers: null
                    }
                }
            })
    })

    it("should select non-empty layer", () => {
        const initialState = {
            editor: createEmptyHistory({
                selected: {
                    emote: 0,
                    layer: null
                },
                layers: { children: [ {} ] }
            }),
            project: { assets: {} }
        }
        store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(selectLayer([0]))
        expect(store).to.have
            .state.like({
                editor: {
                    ...store.getState().editor,
                    present: {
                        selected: {
                            emote: 0,
                            layer: [0]
                        },
                        layers: { children: [ {} ] }
                    }
                }
            })
            .then.dispatched({ f: 'inspect', args: [[0], "layer"] })
    })

    it("should warn when selecting non-existent layer", () => {
        const initialState = {
            editor: createEmptyHistory({
                selected: {
                    emote: 0,
                    layer: null
                },
                layers: { children: [] }
            }),
            project: { assets: {} }
        }
        store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(selectLayer([0]))
        expect(store).to.have
            .state.like({
                editor: {
                    ...store.getState().editor,
                    present: {
                        ...initialState.editor.present,
                        selected: {
                            emote: 0,
                            layer: null
                        }
                    }
                }
            })
            .then.dispatched({ f: 'warn' })
    })

    it("should set emote when selecting a layer with an emote", () => {
        const initialState = {
            editor: createEmptyHistory({
                selected: {
                    emote: 0,
                    layer: null
                },
                layers: { children: [ { emote: 2 } ] }
            }),
            project: { assets: {} }
        }
        store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(selectLayer([0]))
        expect(store).to.have
            .state.like({
                editor: {
                    ...store.getState().editor,
                    present: {
                        ...initialState.editor.present,
                        selected: {
                            emote: 2,
                            layer: [0]
                        }
                    }
                }
            })
            .then.dispatched({ f: 'inspect', args: [[0], "layer"] })
    })

    it("should set emote when selecting a layer with an asset bundle", () => {
        const initialState = {
            editor: createEmptyHistory({
                selected: {
                    emote: 0,
                    layer: null
                },
                layers: { children: [ { id: 'test' } ] }
            }),
            project: {
                assets: {
                    test: {
                        type: 'bundle',
                        conflicts: {
                            emotes: [3]
                        }
                    }
                }
            }
        }
        store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(selectLayer([0]))
        expect(store).to.have
            .state.like({
                editor: {
                    ...store.getState().editor,
                    present: {
                        ...initialState.editor.present,
                        selected: {
                            emote: 3,
                            layer: [0]
                        }
                    }
                }
            })
            .then.dispatched({ f: 'inspect', args: [[0], "layer"] })
    })

    it("should prevent inspecting layer", () => {
        const initialState = {
            editor: createEmptyHistory({
                selected: {
                    emote: 0,
                    layer: null
                },
                layers: { children: [ {} ] }
            }),
            project: { assets: {} }
        }
        store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(selectLayer([0], false))
        expect(store).to.have
            .state.like({
                editor: {
                    ...store.getState().editor,
                    present: {
                        ...initialState.editor.present,
                        selected: {
                            emote: 0,
                            layer: [0]
                        }
                    }
                }
            })
            .not.then.dispatched({ f: 'inspect', args: [[0], "layer"] })
    })
})
