const babble = require('./babble.js')
const electron = require('electron')
const remote = electron.remote
const project = remote.require('./main-process/project')

var puppet
var hotbar = []

babble.init('screen', project.project, project.assets, project.assetsPath, loadPuppets)

function loadPuppets() {
    // Add Puppet
    puppet = babble.addPuppet(createPuppet(project.puppet))

    // Create Hotbar Puppets
    for (var i = 0; i < project.project.hotbar.length; i++) {
        hotbar[i] = babble.createPuppet(project.characters[project.project.hotbar[i]])
    }

    // Request initial puppets
    remote.getCurrentWindow().getParentWindow().webContents.send('init')
}

function createPuppet(actor) {
    var puppet = Object.create(project.characters[actor.name])
    puppet.position = actor.position
    puppet.emote = actor.emote
    puppet.facingLeft = actor.facingLeft
    return puppet
}

function setPuppet(index) {
    // Set Puppet
    babble.setPuppet(puppet.id, hotbar[index])
    puppet = hotbar[index]
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

// Update popout from parent window
electron.ipcRenderer.on('keyDown', (event, key) => {
    if (key == 32) puppet.setBabbling(true)
})

electron.ipcRenderer.on('keyUp', (event, key) => {
    if (key > 48 && key < 58) {
        if (project.project.hotbar.length > key - 49) {
            setPuppet(key - 49)
        }
    } else if (key == 85) puppet.changeEmote('default')
    else if (key == 73) puppet.changeEmote('happy')
    else if (key == 79) puppet.changeEmote('wink')
    else if (key == 80) puppet.changeEmote('kiss')
    else if (key == 74) puppet.changeEmote('angry')
    else if (key == 75) puppet.changeEmote('sad')
    else if (key == 76) puppet.changeEmote('ponder')
    else if (key == 186) puppet.changeEmote('gasp')
    else if (key == 77) puppet.changeEmote('veryangry')
    else if (key == 188) puppet.changeEmote('verysad')
    else if (key == 190) puppet.changeEmote('confused')
    else if (key == 191) puppet.changeEmote('ooo')
    else if (key == 37) puppet.moveLeft()
    else if (key == 39) puppet.moveRight()
    else if (key == 32) puppet.setBabbling(false)
})

electron.ipcRenderer.on('resize', () => {
    babble.resize()
})

electron.ipcRenderer.on('init', (event, puppets) => {
    for (var i = 0; i < puppets.length; i++)
        console.log(babble.addPuppet(createPuppet(puppets[i]), puppets[i].id))
})

electron.ipcRenderer.on('connect', function() {
    babble.clearPuppets()
})

electron.ipcRenderer.on('disconnect', () => {
    babble.clearPuppets()
    puppet = babble.addPuppet(createPuppet(project.puppet), 1)
})

electron.ipcRenderer.on('assign puppet', (event, id) => {
    puppet = babble.addPuppet(createPuppet(project.puppet), id)
})
electron.ipcRenderer.on('add puppet', (event, puppet) => {
    babble.addPuppet(createPuppet(puppet), puppet.id)
})
electron.ipcRenderer.on('set puppet', (event, id, puppet) => {
    babble.setPuppet(id, babble.createPuppet(createPuppet(puppet)))
})
electron.ipcRenderer.on('set emote', (event, id, emote) => {
    babble.getPuppet(id).changeEmote(emote)
})
electron.ipcRenderer.on('move left', (event, id) => {
    babble.getPuppet(id).moveLeft()
})
electron.ipcRenderer.on('move right', (event, id) => {
    babble.getPuppet(id).moveRight()
})
electron.ipcRenderer.on('start babbling', (event, id) => {
    babble.getPuppet(id).setBabbling(true)
})
electron.ipcRenderer.on('stop babbling', (event, id) => {
    babble.getPuppet(id).setBabbling(false)
})
electron.ipcRenderer.on('remove puppet', (event, id) => {
    babble.removePuppet(id)
})
