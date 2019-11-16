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

let store, layers
let changeLayer, setLayers, clear, changeEmote
let deleteLayer, addLayer, wrapLayer
let reducer

const middleware = thunk

describe('redux/editor/layers', function () {
    before(() => {
        mock('../../../src/redux/editor/selected',
            fakeActions('selectLayer', 'setEmote'))
        mock('../../../src/redux/status', fakeActions('warn'))
        mock('../../../src/redux/inspector', fakeActions('inspect', 'close'))

        const l = require('../../../src/redux/editor/layers')
        layers = l.default
        changeLayer = l.changeLayer
        setLayers = l.setLayers
        clear = l.clear
        changeEmote = l.changeEmote
        deleteLayer = l.deleteLayer
        addLayer = l.addLayer
        wrapLayer = l.wrapLayer

        reducer = combineReducers({
            editor: undoable(combineReducers({
                selected: fakeReducer,
                layers,
                id: fakeReducer
            })),
            project: fakeReducer,
            inspector: fakeReducer
        })
    })

    after(mock.stopAll)

    it("should warn if nothing is open in editor", () => {
        const initialState = {
            editor: createEmptyHistory({
                id: null
            })
        }
        store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(changeLayer())
        store.dispatch(changeEmote())
        store.dispatch(deleteLayer())
        store.dispatch(addLayer())
        store.dispatch(wrapLayer())
        expect(store).to.have
            .dispatched({ type: 'fake action', f: 'warn' })
            .then.dispatched({ type: 'fake action', f: 'warn' })
            .then.dispatched({ type: 'fake action', f: 'warn' })
            .then.dispatched({ type: 'fake action', f: 'warn' })
            .then.dispatched({ type: 'fake action', f: 'warn' })
            .not.then.dispatched({ type: 'fake action', f: 'warn' })
    })

    it("should warn if path doesn't exist", () => {
        const initialState = {
            editor: createEmptyHistory({
                id: 0,
                layers: [],
                selected: {}
            }),
            project: { assets: {} },
            inspector: {}
        }
        store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(changeLayer([0,0]))
        store.dispatch(changeEmote([0,0]))
        store.dispatch(deleteLayer([0,0]))
        store.dispatch(addLayer([0,0]))
        store.dispatch(wrapLayer([0,0]))
        expect(store).to.have
            .dispatched({ type: 'fake action', f: 'warn' })
            .then.dispatched({ type: 'fake action', f: 'warn' })
            // changeEmote will set the emote even if it doesn't change the layer's emote
            .then.dispatched({ type: 'fake action', f: 'setEmote' })
            .then.dispatched({ type: 'fake action', f: 'warn' })
            .then.dispatched({ type: 'fake action', f: 'warn' })
            .then.dispatched({ type: 'fake action', f: 'warn' })
            .not.then.dispatched({ type: 'fake action', f: 'warn' })
    })

    it("should change layer", () => {
        const initialState = {
            editor: createEmptyHistory({
                id: 0,
                layers: {
                    children: [
                        { name: 'test' }
                    ]
                },
                selected: {}
            }),
            project: { assets: {} },
            inspector: {}
        }
        store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(changeLayer([0], { name: 'updated' }))
        expect(store).to.have.state.like({
            editor: {
                ...store.getState().editor,
                present: {
                    ...store.getState().editor.present,
                    layers: {
                        children: [
                            { name: 'updated' }
                        ]
                    }
                }
            }
        })
    })

    it("should set layers", () => {
        const initialState = {
            editor: createEmptyHistory({
                id: 0,
                layers: {
                    children: [
                        { name: 'test' }
                    ]
                },
                selected: {}
            }),
            project: { assets: {} },
            inspector: {}
        }
        store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(setLayers({
            children: [
                { name: 'updated' }
            ]
        }))
        expect(store).to.have.state.like({
            editor: {
                ...store.getState().editor,
                present: {
                    ...store.getState().editor.present,
                    layers: {
                        children: [
                            {
                                ...store.getState().editor.present.layers.children[0],
                                name: 'updated'
                            }
                        ]
                    }
                }
            }
        })
    })

    it("should clear", () => {
        const initialState = {
            editor: createEmptyHistory({
                id: 0,
                layers: {
                    children: [
                        { name: 'test' }
                    ]
                },
                selected: {}
            }),
            project: { assets: {} },
            inspector: {}
        }
        store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(clear())
        expect(store).to.have.state.like({
            editor: {
                ...store.getState().editor,
                present: {
                    ...store.getState().editor.present,
                    layers: null
                }
            }
        })
    })

    it("should change emote", () => {
        const initialState = {
            editor: createEmptyHistory({
                id: 0,
                layers: {
                    children: [
                        { name: 'test' }
                    ]
                },
                selected: {}
            }),
            project: { assets: {} },
            inspector: {}
        }
        store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(changeEmote([0], 2))
        expect(store).to.have.state.like({
            editor: {
                ...store.getState().editor,
                present: {
                    ...store.getState().editor.present,
                    layers: {
                        children: [
                            {
                                name: 'test',
                                emote: 2
                            }
                        ]
                    }
                }
            }
        })
        .then.dispatched({ type: 'fake action', f: 'setEmote', args: [2] })
    })

    it("should remove an emote", () => {
        const initialState = {
            editor: createEmptyHistory({
                id: 0,
                layers: {
                    children: [
                        { name: 'test', emote: 3 }
                    ]
                },
                selected: {}
            }),
            project: { assets: {} },
            inspector: {}
        }
        store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(changeEmote([0]))
        expect(store).to.have.state.like({
            editor: {
                ...store.getState().editor,
                present: {
                    ...store.getState().editor.present,
                    layers: {
                        children: [
                            {
                                name: 'test',
                                emote: null
                            }
                        ]
                    }
                }
            }
        })
        .then.dispatched({ type: 'fake action', f: 'setEmote', args: [] })
    })

    it("should remove an emote with an emote inside an asset bundle", () => {
        const initialState = {
            editor: createEmptyHistory({
                id: 0,
                layers: {
                    children: [
                        { name: 'test', emote: 3, id: 'test' }
                    ]
                },
                selected: {}
            }),
            project: { assets: {
                test: {
                    type: 'bundle',
                    emote: 2,
                    conflicts: { emotes: [ 4 ] }
                }
            } },
            inspector: {}
        }
        store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(changeEmote([0]))
        expect(store).to.have.state.like({
            editor: {
                ...store.getState().editor,
                present: {
                    ...store.getState().editor.present,
                    layers: {
                        children: [
                            {
                                name: 'test',
                                emote: null,
                                id: 'test'
                            }
                        ]
                    }
                }
            }
        })
        .then.dispatched({ type: 'fake action', f: 'setEmote', args: [4] })
    })

    it("should delete a top-level layer", () => {
        const initialState = {
            editor: createEmptyHistory({
                id: 0,
                layers: {
                    children: [
                        { name: 'test' }
                    ]
                },
                selected: {}
            }),
            project: { assets: {} },
            inspector: {}
        }
        store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(deleteLayer([0]))
        expect(store).to.have.state.like({
            editor: {
                ...store.getState().editor,
                present: {
                    ...store.getState().editor.present,
                    layers: {
                        children: []
                    }
                }
            }
        })
    })

    it("should close inspector when deleting open layer", () => {
        const initialState = {
            editor: createEmptyHistory({
                id: 0,
                layers: {
                    children: [
                        { name: 'test' }
                    ]
                },
                selected: {}
            }),
            project: { assets: {} },
            inspector: { targetType: 'layer', target: [0] }
        }
        store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(deleteLayer([0]))
        expect(store).to.have.state.like({
            editor: {
                ...store.getState().editor,
                present: {
                    ...store.getState().editor.present,
                    layers: {
                        children: []
                    }
                }
            }
        })
        .then.dispatched({ type: 'fake action', f: 'close' })
    })

    it("should close inspector when deleting parent of open layer", () => {
        const initialState = {
            editor: createEmptyHistory({
                id: 0,
                layers: {
                    children: [
                        { name: 'test' }
                    ]
                },
                selected: {}
            }),
            project: { assets: {} },
            inspector: { targetType: 'layer', target: [0,0] }
        }
        store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(deleteLayer([0]))
        expect(store).to.have.state.like({
            editor: {
                ...store.getState().editor,
                present: {
                    ...store.getState().editor.present,
                    layers: {
                        children: []
                    }
                }
            }
        })
        .then.dispatched({ type: 'fake action', f: 'close' })
    })

    it("should not close inspector when deleting non-open layer", () => {
        const initialState = {
            editor: createEmptyHistory({
                id: 0,
                layers: {
                    children: [
                        { name: 'test' }
                    ]
                },
                selected: {}
            }),
            project: { assets: {} },
            inspector: { targetType: 'layer', target: [1] }
        }
        store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(deleteLayer([0]))
        expect(store).to.have.state.like({
            editor: {
                ...store.getState().editor,
                present: {
                    ...store.getState().editor.present,
                    layers: {
                        children: []
                    }
                }
            }
        })
        .then.not.dispatched({ type: 'fake action', f: 'close' })
    })

    it("should delete selected top-level layer", () => {
        const initialState = {
            editor: createEmptyHistory({
                id: 0,
                layers: {
                    children: [
                        { name: 'test' }
                    ]
                },
                selected: { layer: [0] }
            }),
            project: { assets: {} },
            inspector: {}
        }
        store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(deleteLayer([0]))
        expect(store).to.have.state.like({
            editor: {
                ...store.getState().editor,
                present: {
                    ...store.getState().editor.present,
                    layers: {
                        children: []
                    }
                }
            }
        })
        .then.dispatched({ type: 'fake action', f: 'selectLayer', args: [[]] })
    })

    it("should delete selected non-top-level layer", () => {
        const initialState = {
            editor: createEmptyHistory({
                id: 0,
                layers: {
                    children: [
                        { children: [ { children: [ {} ] } ] }
                    ]
                },
                selected: { layer: [0,0,0] }
            }),
            project: { assets: {} },
            inspector: {}
        }
        store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(deleteLayer([0,0]))
        expect(store).to.have.state.like({
            editor: {
                ...store.getState().editor,
                present: {
                    ...store.getState().editor.present,
                    layers: {
                        children: [
                            { children: [] }
                        ]
                    }
                }
            }
        })
        .then.dispatched({ type: 'fake action', f: 'selectLayer', args: [[0]] })
    })

    it("should add layer", () => {
        const initialState = {
            editor: createEmptyHistory({
                id: 0,
                layers: {
                    children: [ {} ]
                },
                selected: {}
            }),
            project: { assets: {} },
            inspector: {}
        }
        store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(addLayer([0], { name: 'test' }))
        expect(store).to.have.state.like({
            editor: {
                ...store.getState().editor,
                present: {
                    ...store.getState().editor.present,
                    layers: {
                        children: [
                            {
                                children: [
                                    {
                                        ...store.getState().editor.present.layers.children[0].children[0],
                                        name: 'test'
                                    }
                                ]
                            }
                        ]
                    }
                }
            }
        })
    })

    it("should warn if adding layer to asset layer", () => {
        const initialState = {
            editor: createEmptyHistory({
                id: 0,
                layers: {
                    children: [ { id: 'test' } ]
                },
                selected: {}
            }),
            project: { assets: {} },
            inspector: {}
        }
        store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(addLayer([0], { name: 'test' }))
        expect(store).to.have.state.like({
            editor: {
                ...store.getState().editor,
                present: {
                    ...store.getState().editor.present,
                    layers: {
                        children: [ { id: 'test' } ]
                    }
                }
            }
        })
        .then.dispatched({ type: 'fake action', f: 'warn' })
    })

    it("should add root layer", () => {
        const initialState = {
            editor: createEmptyHistory({
                id: 0,
                layers: {
                    children: []
                },
                selected: {}
            }),
            project: { assets: {} },
            inspector: {}
        }
        store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(addLayer([], { name: 'test' }))
        expect(store).to.have.state.like({
            editor: {
                ...store.getState().editor,
                present: {
                    ...store.getState().editor.present,
                    layers: {
                        children: [
                            {
                                ...store.getState().editor.present.layers.children[0],
                                name: 'test'
                            }
                        ]
                    }
                }
            }
        })
    })

    it("should wrap layer", () => {
        const initialState = {
            editor: createEmptyHistory({
                id: 0,
                layers: {
                    children: [ { name: 'test' } ]
                },
                selected: {}
            }),
            project: { assets: {} },
            inspector: {}
        }
        store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(wrapLayer([0]))
        expect(store).to.have.state.like({
            editor: {
                ...store.getState().editor,
                present: {
                    ...store.getState().editor.present,
                    layers: {
                        children: [
                            {
                                ...store.getState().editor.present.layers.children[0],
                                children: [
                                    {
                                        ...store.getState().editor.present.layers.children[0].children[0],
                                        name: 'test'
                                    }
                                ]
                            }
                        ]
                    }
                }
            }
        })
    })
})
