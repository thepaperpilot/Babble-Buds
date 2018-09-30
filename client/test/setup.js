const Application = require('spectron').Application
const path = require('path')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

global.before(() => {
    chai.should()
    chai.use(chaiAsPromised)
})

let electronPath =
    path.join(__dirname, '..', 'node_modules', '.bin', 'electron')

if (process.platform === 'win32') {
    electronPath += '.cmd'
}

let appPath = path.join(__dirname, '..')

if (process.env.PROD) {
    appPath = path.join(appPath, 'build')
}

module.exports = {
    startApp: () => {
        const app = new Application({
            path: electronPath,
            args: [appPath, '--test'],
            env: {
                'ELECTRON_START_URL': 'http://localhost:3000',
                'NODE_ENV': 'production'
            }
        })
        chaiAsPromised.transferPromiseness = app.transferPromiseness
        return app.start()
    },
    startAppWithProject: () => {
        const app = new Application({
            path: electronPath,
            args: [appPath, '--test']
        })
        chaiAsPromised.transferPromiseness = app.transferPromiseness
        return app.start()
    },
    closeApp: (app) => {
        return app.stop()
    }
}
