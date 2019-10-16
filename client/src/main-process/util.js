const {openProject} = require('../electron-starter')
const {app, dialog, BrowserWindow} = require('electron')

const path = require('path')
const fs = require('fs-extra')

// This should totally be possible using remote, but I keep getting an error
//  and this is how I solved it
exports.selectDirectory = function() {
    const browserWindow = BrowserWindow.getFocusedWindow()
    dialog.showOpenDialog(browserWindow, {
        title: 'Projects Folder',
        defaultPath: path.join(app.getPath('home'), 'projects'),
        properties: [
            'openDirectory'
        ] 
    }, (filepaths) => {
        if (filepaths)
            browserWindow.webContents.send('set directory', filepaths[0])
    })
}

exports.selectProject = function() {
    const browserWindow = BrowserWindow.getFocusedWindow()
    dialog.showOpenDialog(browserWindow, {
        title: 'Open Project',
        defaultPath: path.join(app.getPath('home'), 'projects'),
        filters: [
            {name: 'Babble Buds Project File', extensions: ['babble']},
            {name: 'All Files', extensions: ['*']}
        ],
        properties: [
            'openFile'
        ] 
    }, (filepaths) => {
        if (filepaths) {
            browserWindow.webContents.send('set project', filepaths[0])
        }
    })
}

exports.newProject = function(title, location, sample) {
    // Find paths
    let project = sample ? 'sample-project' : 'empty-project'
    let src = path.join(path.dirname(require.main.filename), project)
    let dest = path.join(location, title)

    // Check folder is empty, otherwise stop and alert user
    fs.ensureDirSync(dest, err => {
        console.log(err)
    })
    if (fs.readdirSync(dest).length > 0) {
        dialog.showErrorBox('Folder exists and isn\'t empty', 'You must choose a location and project name such that there either isn\'t a folder there or it is empty.')
        return false
    }

    // Copy sample project to project being created
    fs.copySync(src, dest)
    fs.moveSync(path.join(dest, `${project}.babble`), path.join(dest, `${title}.babble`))

    // Open new project
    exports.openProject(path.join(dest, `${title}.babble`))
}

exports.openProject = function(project) {
    BrowserWindow.getFocusedWindow().webContents.send('set project', project)
}

exports.slugify = function(string) {
    return string.replace(/[^\w\s-]/g, '').trim().toLowerCase().replace(/[-\s]+/g, '-')
}
