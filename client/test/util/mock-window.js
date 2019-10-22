import settingsManager from '../../src/main-process/settings'

global.window = {
    require: () => ({
        remote: {
            require: () => settingsManager
        }
    })
}
