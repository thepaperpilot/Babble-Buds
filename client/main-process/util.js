var path = require('path')
var {app, dialog, BrowserWindow} = require('electron')
var main = require('./../main')

// This should totally be possible using remote, but I keep getting an error
//  and this is how I solved it
exports.selectDirectory = function(callback) {
    dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
        title: 'Projects Folder',
        defaultPath: path.join(app.getPath('home'), 'projects'),
        properties: [
            'openDirectory'
        ] 
    }, callback)
}

exports.selectProject = function() {
    dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
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
            exports.openProject(filepaths[0])
        }
    })
}

exports.openProject = function(string) {
    global.project.filepath = string
    main.redirect('application.html')
}

exports.slugify = function(string) {
    return string.replace(/[^\w\s-]/g, '').trim().toLowerCase().replace(/[-\s]+/g, '-')
}
