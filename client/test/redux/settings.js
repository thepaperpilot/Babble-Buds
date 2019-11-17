import '../util/mock-electron'
import chai, { expect } from 'chai'
import chaiRedux from 'chai-redux'
import thunk from 'redux-thunk'
import { combineReducers } from 'redux'
import settings, { saveLayout, loadLayout } from '../../src/redux/settings'
import settingsManager from '../../src/main-process/settings'
import fs from 'fs-extra'
import path from 'path'

chai.use(chaiRedux)

let store

// We use these to set up a fake settings file before each test
//  (and we remove it afterwards)
const settingsFolder = path.join(__dirname, '..', 'test-user-data')
const settingsFile = path.join(settingsFolder, 'settings.json')
const defaultSettings = {
    "openProject":"",
    "recentProjects":[],
    "layout":"",
    "uuid":"test-uuid",
    "numAssets":0
}

describe('redux/settings', function () {
    beforeEach(() => {
        store = chai.createReduxStore({ reducer: combineReducers({ settings }), middleware: thunk })
        fs.ensureDirSync(settingsFolder)
        fs.writeJsonSync(settingsFile, defaultSettings)
        settingsManager.load()
    })

    after(() => {
        fs.removeSync(settingsFolder)
    })

    it('should save layout', () => {
        store.dispatch(saveLayout('test layout [invalid]'))
        expect(store).to.have.state.like({
            settings: { layout: 'test layout [invalid]', layoutUpdate: 0 }
        })
        expect(fs.readJsonSync(settingsFile)).to.deep.equal(Object.assign({}, defaultSettings, { layout: 'test layout [invalid]' }))
    })

    it('should create folder if not present', () => {
        fs.removeSync(settingsFolder)

        // Rerun 'should save layout' test:
        store.dispatch(saveLayout('test layout [invalid]'))
        expect(store).to.have.state.like({
            settings: { layout: 'test layout [invalid]', layoutUpdate: 0 }
        })
        expect(fs.readJsonSync(settingsFile)).to.deep.equal(Object.assign({}, defaultSettings, { layout: 'test layout [invalid]' }))
    })

    it('should load layout', () => {
        // Rerun 'should save layout' test:
        store.dispatch(loadLayout('test layout [invalid]'))
        expect(store).to.have.state.like({
            settings: { layout: 'test layout [invalid]', layoutUpdate: 1 }
        })
        expect(fs.readJsonSync(settingsFile)).to.deep.equal(Object.assign({}, defaultSettings, { layout: 'test layout [invalid]' }))
    })
})
