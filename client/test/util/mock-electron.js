import mock from 'mock-require'
import path from 'path'

// Electron just returns a string unless started with the electron executable
//  so we'll mock it with just the parts of the API we need, so we don't need
//  to create electron windows
mock('electron', {
    app: {
        // Used in main-process/settings to find user data path
        //  we use a dummy path so current user's settings
        //  don't interfere with the tests
        //  (plus we can now see what they write there as part of the tests)
        getPath: () => path.join(__dirname, '..', 'test-user-data')
    },
    remote: {
        // Used in redux/settings.js to get to the main process' settings manager
        require: () => require('../../src/main-process/settings'),
        app: {
            getVersion: () => process.env.npm_package_version
        }
    }
})
