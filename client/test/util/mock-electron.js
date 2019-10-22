const chaiAsPromised = require('chai-as-promised')
const Application = require('spectron').Application
const electron = require('electron')
const path = require('path')
const m = require('module')

export async function startApp() {
    // Create a fake electron client
    console.log("!")
    const app = await new Application({
        path: electron,
        args: [path.join(__dirname, '..', 'mock-electron')]
    }).start()
    console.log(app)
    chaiAsPromised.transferPromiseness = app.transferPromiseness

    // Setup our mock require('electron')
    const originalLoader = m._load
    const stubs = {
        electron: {
            app: app.client
        }
    }

    // Thank you https://stackoverflow.com/questions/41674033/how-to-mock-require-in-electronjs
    m._load = function(request, parent, isMain) {
        const stub = stubs[request]
        return stub || originalLoader(request, parent, isMain)
    }
    
    // Return our app (which is a promise) so it can get resolved before continuing
    // Had to deal with this issue: https://github.com/electron-userland/spectron/issues/443
    // Eventually got it to work using async in the actual test files, as per this example:
    // https://github.com/florin05/electron-spectron-example
    return app
}

export function stopApp(app) {
    if (app && app.isRunning())
        return app.stop()
}
