// This file is required by the welcome.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const path = require('path')
const remote = require('electron').remote
const app = remote.app
const dialog = remote.dialog
const util = require('electron').remote.require('./main-process/util')
const fs = require('fs-extra')

document.getElementById('location').value = path.join(app.getPath('home'), 'projects')
document.getElementById('open').addEventListener('click', function() {
	util.openProject()
})
document.getElementById('browse').addEventListener('click', function() {
	 util.selectDirectory(function (filepaths) {
		if (filepaths)
			document.getElementById('location').value = filepaths[0];
	})
})
document.getElementById('create').addEventListener('click', function() {
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
	remote.require('./main').setFilepath(path.join(dest, name + '.babble'))
	remote.require('./main').redirect('application.html')
})
