var path = require('path')
var {app, dialog, BrowserWindow} = require('electron')
var project = require('./project')

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

exports.openProject = function() {
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
        if (filepaths)
          project.readProject(filepaths[0])
      })
}
