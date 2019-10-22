const { app, BrowserWindow } = require('electron')

let mainWindow = null

// Since this is a .js file inside the tests directory, mocha will try running it
//  but we only want it running when its being used by spectron to mock electron
//  so if app is undefined, don't continue
//  (kinda wish I could just `return` from outside a function)
console.log(app)
if (app != null) {
    app.on('ready', function () {
        mainWindow = new BrowserWindow({
            show: false,
            webPreferences: {
                nodeIntegration: true
            }
        })
        mainWindow.on('closed', function () { mainWindow = null })
    })
}
