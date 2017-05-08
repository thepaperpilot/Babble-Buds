const electron = require('electron')
const remote = electron.remote
const Stage = require('./stage.js').Stage

var stage
var puppet

function loadPuppets() {
    // Add Puppet
    stage.addPuppet(puppet, puppet.id)

    // Puppet doesn't appear for some reason until you do something to it
    // here's something that doesn't actually do something to it, but tricks
    // the puppet into appearing
    stage.getPuppet(puppet.id).setBabbling(false)

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

electron.ipcRenderer.on('setup', (event, project, mypuppet, id) => {
    puppet = mypuppet
    puppet.id = id
    stage = new Stage('screen', project.project, project.assets, project.assetsPath, loadPuppets)
})

electron.ipcRenderer.on('init', (event, puppets) => {
    for (var i = 0; i < puppets.length; i++)
        stage.addPuppet(puppets[i], puppets[i].charId)
})

electron.ipcRenderer.on('connect', function() {
    stage.clearPuppets()
})

electron.ipcRenderer.on('disconnect', (event, puppet) => {
    stage.clearPuppets()
    stage.addPuppet(puppet, 1)
})

electron.ipcRenderer.on('assign puppet', (event, puppet, id) => {
    stage.addPuppet(puppet, id)
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

remote.getCurrentWindow().getParentWindow().webContents.send('loaded')
