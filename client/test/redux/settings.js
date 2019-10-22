import mockWindow from '../util/mock-window'
import { startApp, stopApp } from '../util/mock-electron'
import chai, { expect } from 'chai'
import chaiRedux from 'chai-redux'
import chaiAsPromised from 'chai-as-promised'
import thunk from 'redux-thunk'
import { combineReducers } from 'redux'
import settings, { saveLayout, loadLayout } from '../../src/redux/settings'
import settingsManager from '../../src/main-process/settings'

chai.should()
chai.use(chaiAsPromised)
chai.use(chaiRedux)

let store, layout

describe('redux/settings', function () {
    let app, saveLayout, loadLayout

    this.timeout(20000)
    
    before(async () => {
        app = await startApp()
        console.log(app)
    })

    beforeEach(() => {
        store = chai.createReduxStore({ reducer: combineReducers({ settings: settings }), middleware: thunk })
        layout = settingsManager.settings.layout
    })

    afterEach(function() {
        if (this.currentTest.state === 'failed') {
            console.log(store.getState())
        }
        settingsManager.setLayout(layout)
        settingsManager.save()
    })
    
    after(async () => {
        await stopApp(app)
    })

    it('should save layout', () => {
        /*store.dispatch(saveLayout('test layout [invalid]'))
        expect(store).to.have.state.like({
            settings: { layout: 'test layout [invalid]', layoutUpdate: 0 }
        })*/
        //expect(fs.readFileSync('file.txt')).to.equal('...')
    })
})
