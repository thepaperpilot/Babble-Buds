import mockElectron from '../../../util/mock-electron'
import chai, { expect } from 'chai'
import chaiRedux from 'chai-redux'
import thunk from 'redux-thunk'
import { combineReducers } from 'redux'
import mock from 'mock-require'
import fakeReducer from '../../../util/fakeReducer'
import fakeActions from '../../../util/fakeActions'
import fs from 'fs-extra'
import path from 'path'

chai.use(chaiRedux)

let addAssets, duplicateAsset, deleteAssets, deleteTab, setLayers,
    renameAsset, moveAsset, createAssetBundle, updateThumbnail
let reducer
let ipcRenderer

// We use these to set up a fake settings file before each test
//  (and we remove it afterwards)
let settingsManager
const settingsFolder = path.join(__dirname, '..', '..', '..', 'test-user-data')
const settingsFile = path.join(settingsFolder, 'settings.json')
const defaultSettings = {
    "openProject":"",
    "recentProjects":[],
    "layout":"",
    "uuid":"test-uuid",
    "numAssets":0
}

const project = path.join(__dirname, '..', '..', '..', 'test-data')
const assetsPath = path.join('assets', 'actions')

const middleware = thunk

describe('redux/project/assets/actions', function () {
    before(() => {
        mockElectron(settingsFolder)
        ipcRenderer = require('electron').ipcRenderer
        settingsManager = mock.reRequire('../../../../src/main-process/settings')
        mock('../../../../src/redux/status', fakeActions('warn'))
        mock('../../../../src/redux/editor/editor', fakeActions('close'))
        mock('../../../../src/redux/project/characters/actions', fakeActions('changeCharacter'))
        mock('../../../../src/redux/project/folders', fakeActions('addFolder', 'removeFolder'))
        mock('../../../../src/redux/editor/layers', fakeActions('changeLayer', 'setLayers'))        
    })

    beforeEach(() => {
        fs.ensureDirSync(settingsFolder)
        fs.writeJsonSync(settingsFile, defaultSettings)
        settingsManager.load()

        const a = mock.reRequire('../../../../src/redux/project/assets/actions')
        addAssets = a.addAssets
        duplicateAsset = a.duplicateAsset
        deleteAssets = a.deleteAssets
        deleteTab = a.deleteTab
        setLayers = a.setLayers
        renameAsset = a.renameAsset
        moveAsset = a.moveAsset
        createAssetBundle = a.createAssetBundle
        updateThumbnail = a.updateThumbnail

        const assets = mock.reRequire('../../../../src/redux/project/assets/reducers').default
        reducer = combineReducers({
            project: combineReducers({
                assets,
                folders: fakeReducer,
                settings: fakeReducer,
                project: fakeReducer,
                characters: fakeReducer
            }),
            editor: fakeReducer,
            self: fakeReducer
        })
    })

    afterEach(() => {
        fs.removeSync(
            path.join(project, assetsPath, 'test-id'),
            { throws: false }
        )
    })

    after(mock.stopAll)

    after(() => {
        fs.removeSync(settingsFolder)
    })

    it('should add assets', () => {
        const initialState = {
            project: {
                assets: {},
                folders: []
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(addAssets({ test: { tab: 'test' }, test2: {} }))
        expect(store).to.have.state.like({
            project: {
                ...store.getState().project,
                assets: {
                    test: { tab: 'test' },
                    test2: {}
                }
            }
        })
        .then.dispatched({ f: 'addFolder' })
    })

    it('should duplicate asset', () => {
        const initialState = {
            project: {
                assets: { test: { tab: 'test', location: 'test.png' } },
                project,
                settings: {
                    assetsPath
                }
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(duplicateAsset('test'))
        expect(store.getState().project.assets[`${defaultSettings.uuid}:1`].tab).to.eql('test')
    })

    it('should delete assets', () => {
        const initialState = {
            project: {
                assets: { test: { tab: 'test', location: 'test.png' } },
                project,
                settings: {
                    assetsPath
                },
                characters: {
                    testCharacter: {
                        layers: {
                            children: [
                                { id: 'test' }
                            ]
                        }
                    }
                }
            },
            editor: {
                present: {}
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(deleteAssets([ 'test' ]))
        expect(store).to.have.state.like({
            project: {
                ...store.getState().project,
                assets: {}
            }
        })
        .then.dispatched({
            f: 'changeCharacter',
            args: [ 'testCharacter', { layers: { children: [] } } ]
        })
    })

    it('should delete asset used in puppet open in editor', () => {
        const initialState = {
            project: {
                assets: { test: { tab: 'test', location: 'test.png' } },
                project,
                settings: {
                    assetsPath
                },
                characters: {}
            },
            editor: {
                present: {
                    type: 'puppet',
                    id: 'testCharacter',
                    layers: {
                        children: [
                            { id: 'test' }
                        ]
                    }
                }
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(deleteAssets([ 'test' ]))
        expect(store).to.have.dispatched({ f: 'setLayers', args: [{ children: [] }] })
    })

    it('should delete asset open in editor', () => {
        const initialState = {
            project: {
                assets: { test: { tab: 'test', location: 'test.png' } },
                project,
                settings: {
                    assetsPath
                },
                characters: {}
            },
            editor: {
                present: {
                    type: 'asset',
                    id: 'test'
                }
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(deleteAssets([ 'test' ]))
        expect(store).to.have.dispatched({ f: 'close' })
    })

    it('should delete tab', () => {
        const initialState = {
            project: {
                assets: {
                    test: { tab: 'test' },
                    test2: { tab: 'test' },
                    notTest: { tab: 'notTest' }
                },
                project,
                settings: {
                    assetsPath
                },
                characters: {}
            },
            editor: {
                present: {}
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(deleteTab("test"))
        expect(store).to.have.state.like({
            project: {
                ...store.getState().project,
                assets: { notTest: { tab: 'notTest' } }
            }
        })
        .then.dispatched({ f: 'removeFolder', args: ['test'] })
    })

    it('should set layers', () => {
        const initialState = {
            project: {
                assets: {
                    'testid:test': { version: 0 }
                },
                project,
                settings: {
                    assetsPath
                }
            },
            self: 'testid'
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })
        let backgroundMessage
        ipcRenderer.on('background', (e, ...data) => {
            backgroundMessage = data
        })

        const layers = { children: [] }
        store.dispatch(setLayers("testid:test", layers))
        expect(store).to.have.state.like({
            project: {
                ...store.getState().project,
                assets: {
                    "testid:test": {
                        layers,
                        conflicts: {
                            head: false,
                            emoteLayer: false,
                            emotes: []
                        },
                        version: 1
                    }
                }
            }
        })
        expect(backgroundMessage).to.eql([
            "generate thumbnails",
            path.join(project, assetsPath, 'testid', 'test'),
            { layers },
            'asset',
            'testid:test'
        ])
        ipcRenderer.removeAllListeners('background')
    })

    it('should rename asset', () => {
        const initialState = {
            project: {
                assets: { test: { name: 'test', version: 0 } },
                project,
                settings: {
                    assetsPath
                }
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(renameAsset('test', 'updated'))
        expect(store).to.have.state.like({
            project: {
                ...store.getState().project,
                assets: {
                    test: {
                        name: 'updated',
                        version: 1
                    }
                }
            }
        })
    })

    it('should move asset', () => {
        const initialState = {
            project: {
                assets: { test: { tab: 'test', version: 0 } },
                project,
                settings: {
                    assetsPath
                },
                folders: [ 'test' ]
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(moveAsset('test', 'updated'))
        expect(store).to.have.state.like({
            project: {
                ...store.getState().project,
                assets: {
                    test: {
                        tab: 'updated',
                        version: 1
                    }
                }
            }
        })
        .then.dispatched({ f: 'addFolder', args: [ 'updated' ] })
    })

    it('should create asset bundle', () => {
        // Which came first, the layer or the asset bundle?
        const layers = {
            children: [
                {
                    name: "test",
                    tab: "testtab",
                    id: "test:1"   
                }
            ]
        }
        const initialState = {
            project: {
                assets: {},
                project,
                settings: {
                    assetsPath
                },
                folders: []
            },
            editor: {
                present: {
                    layers: {
                        children: [
                            layers
                        ]
                    }
                }
            },
            self: 'testid'
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })
        let backgroundMessage
        ipcRenderer.on('background', (e, ...data) => {
            backgroundMessage = data
        })

        store.dispatch(createAssetBundle([0], "test", "testtab"))
        expect(store).to.have.state.like({
            project: {
                ...store.getState().project,
                assets: {
                    "testid:1": {
                        name: 'test',
                        tab: 'testtab',
                        layers,
                        location: 'testid/1.png',
                        type: 'bundle',
                        conflicts: {
                            head: false,
                            emoteLayer: false,
                            emotes: []
                        }
                    }
                }
            }
        })
        .and.dispatched({ f: 'addFolder', args: [ 'testtab' ] })
        .and.dispatched({
            f: 'changeLayer',
            args: [
                [],
                { children: [ { id: 'testid:1' } ] }
            ]
        })
        expect(backgroundMessage).to.eql([
            "generate thumbnails",
            path.join(project, assetsPath, 'testid', '1'),
            { layers },
            'asset',
            'testid:1'
        ])
        ipcRenderer.removeAllListeners('background')
    })

    it('should create asset bundle out of asset layer', () => {
        const layers = {
            name: "test",
            tab: "testtab",
            id: "test:1"
        }
        const initialState = {
            project: {
                assets: {},
                project,
                settings: {
                    assetsPath
                },
                folders: []
            },
            editor: {
                present: {
                    layers: {
                        children: [
                            layers
                        ]
                    }
                }
            },
            self: 'testid'
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })
        let backgroundMessage
        ipcRenderer.on('background', (e, ...data) => {
            backgroundMessage = data
        })

        store.dispatch(createAssetBundle([0], "test", "testtab"))
        expect(store).to.have.state.like({
            project: {
                ...store.getState().project,
                assets: {
                    "testid:1": {
                        name: 'test',
                        tab: 'testtab',
                        layers: { children: [ layers ] },
                        location: 'testid/1.png',
                        type: 'bundle',
                        conflicts: {
                            head: false,
                            emoteLayer: false,
                            emotes: []
                        }
                    }
                }
            }
        })
        ipcRenderer.removeAllListeners('background')
    })

    it('should warn if creating asset bundle from non-existent layer', () => {
        const initialState = {
            project: {
                assets: {},
                project,
                settings: {
                    assetsPath
                },
                folders: []
            },
            editor: {
                present: {
                    layers: {
                        children: []
                    }
                }
            },
            self: 'testid'
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(createAssetBundle([0], "test", "testtab"))
        expect(store).to.have.dispatched({ f: "warn" })
    })

    it('should update thumbnail', () => {
        const initialState = {
            project: {
                assets: {
                    test: {
                        version: 0
                    }
                }
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        const thumbnailPath = path.join(project, assetsPath, "test")
        store.dispatch(updateThumbnail("test", thumbnailPath))
        expect(store).to.have.state.like({
            project: {
                ...store.getState().project,
                assets: {
                    test: {
                        location: path.join("actions", "test.png"),
                        version: 1
                    }
                }
            }
        })
    })

    it('should warn if accessing an asset that doesn\'t exist', () => {
        const initialState = {
            project: {
                assets: {},
                characters: {}
            },
            editor: {
                present: {}
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(duplicateAsset("invalid"))
        // Shouldn't warn, just not crash
        store.dispatch(deleteAssets(["invalid"]))
        store.dispatch(setLayers("invalid"))
        store.dispatch(renameAsset("invalid"))
        store.dispatch(moveAsset("invalid"))
        store.dispatch(updateThumbnail("invalid"))
        expect(store).to.have.dispatched({ f: 'warn' })
            // This is from the deleteAssets call
            .then.dispatched({ ids: ["invalid"] })
            .then.dispatched({ f: 'warn' })
            .then.dispatched({ f: 'warn' })
            .then.dispatched({ f: 'warn' })
            .then.dispatched({ f: 'warn' })
            .not.then.dispatched({ f: 'warn' })
    })
})
