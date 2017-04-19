const electron = require('electron')
const remote = electron.remote
const project = remote.require('./main-process/project')
const Stage = require('./stage.js').Stage

var stage = new Stage('screen', project.project, project.assets, project.assetsPath, loadPuppets)

function loadPuppets() {
    // Add Puppet
    var puppet = stage.addPuppet(project.getPuppet(), 1)

    // Request initial puppets
    remote.getCurrentWindow().getParentWindow().webContents.send('init')
}

// Send inputs back to parent window
window.onkeydown = function(e) {
    var key = e.keyCode ? e.keyCode : e.which;

    remote.getCurrentWindow().getParentWindow().webContents.send('keyDown', key)
}

window.onkeyup = function(e) {
    var key = e.keyCode ? e.keyCode : e.which;

    if (key == 27) { 
        remote.getCurrentWindow().close()
        return
    }

    remote.getCurrentWindow().getParentWindow().webContents.send('keyUp', key)
}

electron.ipcRenderer.on('resize', () => {
    stage.resize()
})

electron.ipcRenderer.on('init', (event, puppets) => {
    for (var i = 0; i < puppets.length; i++)
        stage.addPuppet(puppets[i], puppets[i].charId)
})

electron.ipcRenderer.on('connect', function() {
    stage.clearPuppets()
})

electron.ipcRenderer.on('disconnect', () => {
    stage.clearPuppets()
    stage.addPuppet(project.getPuppet(), 1)
})

electron.ipcRenderer.on('assign puppet', (event, id) => {
    stage.addPuppet(project.getPuppet(), id)
})
electron.ipcRenderer.on('add puppet', (event, puppet) => {
    stage.addPuppet(puppet, puppet.charId)
})
electron.ipcRenderer.on('set puppet', (event, id, puppet) => {
    stage.setPuppet(id, stage.createPuppet(puppet))
})
electron.ipcRenderer.on('set emote', (event, id, emote) => {
    stage.getPuppet(id).changeEmote(emote)
})
electron.ipcRenderer.on('move left', (event, id) => {
    stage.getPuppet(id).moveLeft()
})
electron.ipcRenderer.on('move right', (event, id) => {
    stage.getPuppet(id).moveRight()
})
electron.ipcRenderer.on('start babbling', (event, id) => {
    stage.getPuppet(id).setBabbling(true)
})
electron.ipcRenderer.on('stop babbling', (event, id) => {
    stage.getPuppet(id).setBabbling(false)
})
electron.ipcRenderer.on('remove puppet', (event, id) => {
    stage.removePuppet(id)
})
electron.ipcRenderer.on('add asset', (event, asset) => {
    stage.addAsset(asset)
})
