// This file is required by the welcome.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const path = require('path')
const {app, dialog} = require('electron').remote
const util = require('electron').remote.require('./main-process/util')
const project = require('electron').remote.require('./main-process/project')
const fs = require('fs-extra')

document.getElementById('location').value = path.join(app.getPath('home'), 'projects')
document.getElementById('open').addEventListener('click', function(e) {
	util.openProject()
})
document.getElementById('browse').addEventListener('click', function(e) {
	 util.selectDirectory(function (filepaths) {
		if (filepaths)
			document.getElementById('location').value = filepaths[0];
	})
})
document.getElementById('create').addEventListener('click', function(e) {
	// Find paths
	var src = path.join(path.dirname(require.main.filename), 'sample-project')
	var location = document.getElementById('location').value
	var name = document.getElementById('name').value
	var dest = path.join(location, name)

	// Check folder is empty, otherwise stop and alert user
	fs.ensureDirSync(dest, err => {
  		console.log(err)
	})
	if (fs.readdirSync(dest).length > 0) {
		dialog.showErrorBox("Folder exists and isn't empty", "You must choose a location and project name such that there either isn't a folder there or it is empty.")
		return false;
	}

	// Copy sample project to project being created
	fs.copySync(src, dest)
	fs.moveSync(path.join(dest, 'sample-project.babble'), path.join(dest, name + '.babble'))

	// Open new project
	project.readProject(path.join(dest, name + '.babble'))
})
