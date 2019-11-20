import mock from 'mock-require'
import path from 'path'

const defaultPath = path.join(__dirname, '..', 'test-user-data')

function setup(settingsPath) {
    // Electron just returns a string unless started with the electron executable
    //  so we'll mock it with just the parts of the API we need, so we don't need
    //  to create electron windows
    mock('electron', {
        app: {
            // Used in main-process/settings to find user data path
            //  we use a dummy path so current user's settings
            //  don't interfere with the tests
            //  (plus we can now see what they write there as part of the tests)
            getPath: () => settingsPath || defaultPath
        },
        remote: {
            // Used in redux/settings.js to get to the main process' settings manager
            require: (path) => {
                if (path.includes('settings'))
                    return require('../../src/main-process/settings')
                else if (path.includes('menu'))
                    return { updateMenu: () => {} }
            },
            app: {
                getVersion: () => process.env.npm_package_version
            },
            dialog: {
                showMessageBox: () => 1
            }
        },
        ipcRenderer: {
            events: {},
            on(event, handler) {
                this.events[event] = handler;
            },
            send(event, ...data) {
                this.events[event](event, ...data);
            },
            removeAllListeners(event) {
                this.events[event] = undefined;
            }
        }
    })
}

setup()

module.exports = setup
