const { ipcRenderer } = require('electron')
const { Stage } = require('babble.js')
const fs = require('fs-extra')
const path = require('path')

const stage = new Stage('stage', {'numCharacters': 1, 'puppetScale': .2}, {}, '')

ipcRenderer.on('update assets', (e, assets, assetsPath) => {
    stage.assets = assets
    stage.assetsPath = assetsPath
    stage.reloadAssets()
})

ipcRenderer.on('generate thumbnails', (e, thumbnailsPath, character, type, id) => {
    // Put puppet on the stage
    stage.clearPuppets()
    character.position = 1
    character.facingLeft = false
    character.emote = 0
    const puppet = stage.addPuppet(character)

    // Take puppet screenshot
    let empty = document.createElement('canvas')
    empty.width = stage.renderer.view.width
    empty.height = stage.renderer.view.height
    stage.renderer.render(stage.stage)
    const data = stage.renderer.view.toDataURL() === empty.toDataURL() ? null : stage.getThumbnail()

    // Write thumbnail to files
    fs.ensureDirSync(thumbnailsPath)
    if (data)
        fs.writeFileSync(`${thumbnailsPath}.png`, new Buffer(data, 'base64'))
        
    // Generate emote screenshots
    // Make only the heads visible
    // (yeah, I realize I don't really have a good way of doing that)
    const handleLayer = visible => layer => {
        layer.visible = visible
        layer.children.forEach(handleLayer(visible))
    }
    const bubbleVisibility = layer => {
        if (!layer.parent) return
        layer.parent.visible = layer.visible
        bubbleVisibility(layer.parent)
    }
    handleLayer(false)(puppet.container)
    puppet.head.forEach(handleLayer(true))
    puppet.head.forEach(bubbleVisibility)

    // Make a thumbnail for each emote
    Object.keys(puppet.emotes).forEach(emote => {
        puppet.changeEmote(emote)
        stage.renderer.render(stage.stage)
        const data = stage.renderer.view.toDataURL() === empty.toDataURL() ? null : stage.getThumbnail()
        if (data)
            fs.writeFileSync(path.join(thumbnailsPath, `${emote}.png`), new Buffer(data, 'base64'))
    })

    // Send info back
    ipcRenderer.send('foreground', 'update thumbnails', type, id, thumbnailsPath)
})
