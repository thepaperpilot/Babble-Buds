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

let layers
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

        const l = mock.reRequire('../../../src/redux/editor/layers')
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
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(changeLayer())
        store.dispatch(changeEmote())
        store.dispatch(deleteLayer())
        store.dispatch(addLayer())
        store.dispatch(wrapLayer())
        expect(store).to.have
            .dispatched({ f: 'warn' })
            .then.dispatched({ f: 'warn' })
            .then.dispatched({ f: 'warn' })
            .then.dispatched({ f: 'warn' })
            .then.dispatched({ f: 'warn' })
            .not.then.dispatched({ f: 'warn' })
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
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(changeLayer([0,0]))
        store.dispatch(changeEmote([0,0]))
        store.dispatch(deleteLayer([0,0]))
        store.dispatch(addLayer([0,0]))
        store.dispatch(wrapLayer([0,0]))
        expect(store).to.have
            .dispatched({ f: 'warn' })
            .then.dispatched({ f: 'warn' })
            // changeEmote will set the emote even if it doesn't change the layer's emote
            .then.dispatched({ f: 'setEmote' })
            .then.dispatched({ f: 'warn' })
            .then.dispatched({ f: 'warn' })
            .then.dispatched({ f: 'warn' })
            .not.then.dispatched({ f: 'warn' })
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
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(changeLayer([0], { name: 'updated' }))
        expect(store.getState().editor.present.layers.children[0].name).to.eql('updated')
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
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(setLayers({
            children: [
                { name: 'updated' }
            ]
        }))
        expect(store.getState().editor.present.layers.children[0].name).to.eql('updated')
    })

    it("should move selected layers", () => {
        const initialState = {
            editor: createEmptyHistory({
                id: 0,
                layers: {
                    children: [
                        { children: [ { name: 'test', path: [0, 0] } ] }
                    ]
                },
                selected: { layer: [0, 0] }
            }),
            project: { assets: {} },
            inspector: {}
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(setLayers({
            children: [
                { children: [] },
                { name: 'test', path: [0, 0] }
            ]
        }))
        expect(store).to.have.state.like({
            editor: {
                ...store.getState().editor
            }
        })
        // Making sure this gets dispatched only after the state changes
        .then.dispatched({ f: 'selectLayer', args: [[1]] })
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
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(clear())
        expect(store.getState().editor.present.layers).to.be.null
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
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(changeEmote([0], 2))
        expect(store.getState().editor.present.layers.children[0].emote).to.eql(2)
        expect(store).to.have.dispatched({ f: 'setEmote', args: [2] })
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
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(changeEmote([0]))
        expect(store.getState().editor.present.layers.children[0].emote).to.be.null
        expect(store).to.have.dispatched({ f: 'setEmote', args: [] })
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
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(changeEmote([0]))
        expect(store.getState().editor.present.layers.children[0].emote).to.be.null
        expect(store).to.have.dispatched({ f: 'setEmote', args: [4] })
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
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(deleteLayer([0]))
        expect(store.getState().editor.present.layers.children).to.be.empty
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
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(deleteLayer([0]))
        expect(store.getState().editor.present.layers.children).to.be.empty
        expect(store).to.have.dispatched({ f: 'close' })
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
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(deleteLayer([0]))
        expect(store.getState().editor.present.layers.children).to.be.empty
        expect(store).to.have.dispatched({ f: 'close' })
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
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(deleteLayer([0]))
        expect(store.getState().editor.present.layers.children).to.be.empty
        expect(store).to.not.have.dispatched({ f: 'close' })
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
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(deleteLayer([0]))
        expect(store.getState().editor.present.layers.children).to.be.empty
        expect(store).to.have.dispatched({ f: 'selectLayer', args: [[]] })
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
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(deleteLayer([0,0]))
        expect(store.getState().editor.present.layers.children[0].children).to.be.empty
        expect(store).to.have.dispatched({ f: 'selectLayer', args: [[0]] })
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
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(addLayer([0], { name: 'test' }))
        expect(store.getState().editor.present.layers.children[0].children).to.have.lengthOf(1)
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
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(addLayer([0], { name: 'test' }))
        expect(store.getState().editor.present.layers.children[0].children).to.be.undefined
        expect(store).to.have.dispatched({ f: 'warn' })
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
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(addLayer([], { name: 'test' }))
        expect(store.getState().editor.present.layers.children).to.have.lengthOf(1)
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
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(wrapLayer([0]))
        expect(store.getState().editor.present.layers.children[0].children[0].name).to.eql('test')
    })
})
