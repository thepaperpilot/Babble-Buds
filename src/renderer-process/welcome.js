// This file is required by the welcome.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const path = require('path')
const remote = require('electron').remote
const app = remote.app
const dialog = remote.dialog
const util = remote.require('./main-process/util')
const settings = remote.require('./main-process/settings')
const fs = require('fs-extra')

document.getElementById('location').value = path.join(app.getPath('home'), 'projects')
document.getElementById('open').addEventListener('click', function() {
	util.selectProject()
})
document.getElementById('browse').addEventListener('click', function() {
	 util.selectDirectory(function (filepaths) {
		if (filepaths)
			document.getElementById('location').value = filepaths[0];
	})
})
document.getElementById('create').addEventListener('submit', function(e) {
	// Prevent page from refreshing
	e.preventDefault()

	// Find paths
	var project = document.getElementById('sample').checked ? 'sample-project' : 'empty-project'
	var src = path.join(path.dirname(require.main.filename), project)
	var location = document.getElementById('location').value
	var name = document.getElementById('name').value
	var dest = path.join(location, name)

	// Check folder is empty, otherwise stop and alert user
	fs.ensureDirSync(dest, err => {
  		console.log(err)
	})
	if (fs.readdirSync(dest).length > 0) {
		dialog.showErrorBox("Folder exists and isn't empty", "You must choose a location and project name such that there either isn't a folder there or it is empty.")
		return false
	}

	// Copy sample project to project being created
	fs.copySync(src, dest)
	fs.moveSync(path.join(dest, project + '.babble'), path.join(dest, name + '.babble'))

	// Open new project
	remote.require('./main').setFilepath(path.join(dest, name + '.babble'))
	remote.require('./main').redirect('application.html')
})
var recentProjectsElement = document.getElementById('recent-projects')
var recentProjects = settings.settings.recentProjects
for (var i = 0; i < recentProjects.length; i++) {
	var filename = util.slugify(recentProjects[i])
	var selector = document.createElement('div')
    selector.id = recentProjects[i]
    selector.className = "recent-project"
    selector.style.backgroundImage = 'url(' +  path.join(app.getPath('userData'), filename + '.png') + ')'
    recentProjectsElement.appendChild(selector)
    selector.innerHTML = '<div class="desc">' + recentProjects[i].replace(/^.*[\\\/]/, '') + '</div>'
    selector.addEventListener('click', openProject)
}
function openProject() {
    util.openProject(this.id)
}
