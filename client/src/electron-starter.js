const {protocol, app, BrowserWindow, ipcMain} = require('electron')
const windowStateKeeper = require('electron-window-state')
const settings = require('./main-process/settings')

const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let backgroundWindow
let popoutWindow

function createWindow() {
    protocol.registerFileProtocol('file', (request, callback) => {
        let pathname = decodeURI(request.url.replace('file:///', ''));
        if (pathname.indexOf('?') > 0)
            pathname = pathname.substring(0, pathname.indexOf("?"))
        callback(pathname);
    });

    // Load application settings
    settings.load()

    // Load window states
    let mainWindowState = windowStateKeeper({
        defaultWidth: 1280,
        defaultHeight: 720
    })
    let popoutWindowState = windowStateKeeper({
        defaultWidth: 1280,
        defaultHeight: 720,
        file: "popout-window-state.json"
    })

    // Create the browser window.
    mainWindow = new BrowserWindow({
        'x': mainWindowState.x,
        'y': mainWindowState.y,
        'width': mainWindowState.width,
        'height': mainWindowState.height,
        backgroundColor: '#242a33',
        icon: path.join(__dirname, '..', 'public', 'icons', 'icon.ico'),
        webPreferences: {
            // Used to use images stored on person's computer
            // if you can find a way to do that without this option, do it!
            webSecurity: false,
            nodeIntegration: true
        }
    })

    mainWindowState.manage(mainWindow)

    // and load the index.html of the app.
    mainWindow.loadURL(process.env.ELECTRON_START_URL || url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }))

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
        backgroundWindow.destroy()
        backgroundWindow = null
        popoutWindow.destroy()
        popoutWindow = null
    })

    // Create background window
    backgroundWindow = new BrowserWindow({
        show: false,
        webPreferences: {
            nodeIntegration: true
        }
    })
    backgroundWindow.openDevTools()
    backgroundWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'background', 'index.html'),
        protocol: 'file:',
        slashes: true
    }))

    // Create popout window
    popoutWindow = new BrowserWindow({
        'x': popoutWindowState.x,
        'y': popoutWindowState.y,
        'width': popoutWindowState.width,
        'height': popoutWindowState.height,
        show: false,
        frame: false,
        backgroundColor: '#242a33',
        icon: path.join(__dirname, '..', 'public', 'icons', 'icon.ico'),
        webPreferences: {
            webSecurity: false,
            nodeIntegration: true
        }
    })

    popoutWindowState.manage(popoutWindow)

    popoutWindow.loadURL(process.env.ELECTRON_POPOUT_START_URL || url.format({
        pathname: path.join(__dirname, 'popout-index.html'),
        protocol: 'file:',
        slashes: true
    }))

    popoutWindow.on('close', function (event) {
        popoutWindow.hide()
        event.preventDefault()
    })

    popoutWindow.on('hide', function () {
        mainWindow.focus()
    })

    // Setup passthroughs between the foreground and background windows
    ipcMain.on('background', (e, ...event) => backgroundWindow.webContents.send(...event))
    ipcMain.on('foreground', (e, ...event) => mainWindow.webContents.send(...event))
    ipcMain.on('popout', (e, ...event) => popoutWindow.webContents.send(...event))
    // TODO if you hide the background window, it will ignore ipc messages :(
    ipcMain.on('change background visibility', (e, visible) => backgroundWindow[visible ? 'show' : 'hide']())
    ipcMain.on('toggle background visibility', () => backgroundWindow[backgroundWindow.isVisible() ? 'hide' : 'show']())
    ipcMain.on('toggle popout visibility', () => popoutWindow[popoutWindow.isVisible() ? 'hide' : 'show']())

    // Create the application menu
    require('./main-process/menus/application-menu.js')
    require('./main-process/shortcuts')
}

exports.openProject = function() {
    backgroundWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'background', 'index.html'),
        protocol: 'file:',
        slashes: true
    }))
}

// Holy shit this one line of code fixed all my performance issues
app.disableHardwareAcceleration()

app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
