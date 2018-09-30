const setup = require('./setup')

describe('Open electron', () => {
    let app

    beforeEach(() => {
        return setup.startApp().then(a => app = a)
    })

    afterEach(() => {
        return setup.closeApp(app)
    })

    it('opens window', function () {
        // TODO this is slow as shit, and errors because waitUntilWindowLoaded tries to access
        // the app's webContents, which is undefined whenever I create two windows (I have a
        // background window for background tasks)
        return app.client.waitUntilWindowLoaded().getWindowCount().should.eventually.equal(2)
    })
})
