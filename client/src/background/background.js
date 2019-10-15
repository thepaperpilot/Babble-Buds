const { ipcRenderer, remote } = window.require('electron')
const { Stage } = window.require('babble.js')
const fs = window.require('fs-extra')
const path = window.require('path')

const { GIF } = window.require('gif-engine-js')

const stage = new Stage('stage', {'numCharacters': 1, 'puppetScale': 1, 'animations': false}, {}, '', null, console)

async function addAssets(assets, statusId, callback) {
    // This is a bit complicated because we want to batch our requests. I found that even just limiting it to 1/ms is fine, though
    let assetsToSend = {}
    let lastMessageSent = new Date().getTime()

    // Update the main window that we've new assets to add
    const sendMessage = () => {
        ipcRenderer.send('foreground', 'import assets', assetsToSend, statusId)
        assetsToSend = {}
        lastMessageSent = new Date().getTime()
    }

    await Promise.all(Object.keys(assets).map(async id => {
        const asset = assets[id]

        await callback(asset, id)

        assetsToSend[id] = asset
        if (new Date().getTime() - lastMessageSent > 1)
            sendMessage()
    }))
    
    // Send any remaining assets that didn't get sent yet
    if (Object.keys(assetsToSend).length > 0)
        sendMessage()
}

const handleLayer = visible => layer => {
    layer.visible = visible
    layer.children.forEach(handleLayer(visible))
}
const bubbleVisibility = layer => {
    if (!layer.parent) return
    layer.parent.visible = layer.visible
    bubbleVisibility(layer.parent)
}

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

    // If its an asset bundle, ignore emotes
    if (type === 'asset') {
        handleLayer(true)(puppet.container)
    }

    // Take puppet screenshot
    let empty = document.createElement('canvas')
    const {width, height} = stage.stage
    
    //ipcRenderer.send('change background visibility', true)

    if (type === 'environment') {
        const w = Math.ceil(character.width)
        const h = Math.ceil(character.height)
        stage.resize(null, w, h)
        empty.width = w
        empty.height = h
        remote.getCurrentWindow().setContentSize(w, h)
    } else {
        const w = Math.ceil(width)
        const h = Math.ceil(height)
        stage.resize(null, w, h)
        empty.width = w
        empty.height = h
        remote.getCurrentWindow().setContentSize(w, h)
    }

    stage.renderer.render(stage.stage)
    const data = stage.renderer.view.toDataURL() === empty.toDataURL() ? null : stage.getThumbnail()

    // Write thumbnail to files
    if (data)
        fs.writeFileSync(`${thumbnailsPath}.png`, Buffer.from(data, 'base64'))
    else fs.removeSync(`${thumbnailsPath}.png`)

    if (type !== 'asset') {
        // Generate emote screenshots
        fs.ensureDirSync(thumbnailsPath)

        // Make only the heads visible
        // (yeah, I realize I don't really have a good way of doing that)
        handleLayer(false)(puppet.container)
        puppet.head.forEach(handleLayer(true))
        puppet.head.forEach(bubbleVisibility)

        // Make a thumbnail for each emote
        Object.keys(puppet.emotes).forEach(emote => {
            puppet.changeEmote(emote)
            stage.renderer.render(stage.stage)
            const data = stage.renderer.view.toDataURL() === empty.toDataURL() ? null : stage.getThumbnail()
            const emotePath = path.join(thumbnailsPath, `${emote}.png`)
            if (data)
                fs.writeFileSync(emotePath, Buffer.from(data, 'base64'))
            else fs.removeSync(emotePath)
        })
    }

    // Send info back
    ipcRenderer.send('foreground', 'update thumbnails', type, id, thumbnailsPath)

    //ipcRenderer.send('change background visibility', false)
})

ipcRenderer.on('import', async (e, duplicate, selected, oldAssetsPath, newAssetsPath, statusId) => {
    await addAssets(selected, statusId, async (asset, id) => {
        // Copy the files over
        const newLocation = `${id.replace(':', '/')}.${asset.location.slice(-3)}`
        const newThumbnailLocation = `${id.replace(':', '/')}.thumb.${asset.location.slice(-3)}`

        await fs.copy(path.join(oldAssetsPath, asset.location),
            path.join(newAssetsPath, newLocation))
        asset.location = newLocation
        if (asset.thumbnail) {
            await fs.copy(path.join(oldAssetsPath, asset.thumbnail),
                path.join(newAssetsPath, newThumbnailLocation))
            asset.thumbnail = newThumbnailLocation
        }
    })
})

ipcRenderer.on('add assets', async (e, assets, assetsPath, statusId) => {
    await fs.ensureDir(assetsPath)
    await addAssets(assets, statusId, async asset => {
        let file = await fs.readFile(asset.filepath)

        if (asset.type === 'animated') {
            // Default values (overriden if importing a gif)
            let rows = 1
            let cols = 1
            let numFrames = 1
            let delay = 60

            if (asset.filepath.substr(asset.filepath.length - 4) === '.gif') {
                // If gif, turn it into animated png spritesheet
                let gif = await GIF(new Uint8Array(file).buffer)
                numFrames = gif.frames.length
                delay = gif.frames[0].graphicExtension.delay
                
                // Optimize rows and columns to make an approximately square sheet
                // (idk if this is useful but figured it wouldn't hurt)
                rows = Math.ceil(Math.sqrt(gif.frames.length))
                cols = Math.ceil(gif.frames.length / rows)
                const width = gif.descriptor.width
                const height = gif.descriptor.height
                
                // Create canvas to put each frame onto
                var canvas = document.createElement('canvas')
                var ctx = canvas.getContext('2d')
                
                // Create thumbnail first
                canvas.width = width
                canvas.height = height
                ctx.putImageData(...(await gif.toImageData(0)))
                await fs.writeFile(path.join(assetsPath, asset.thumbnail),
                    Buffer.from(canvas.toDataURL()
                        .replace(/^data:image\/\w+;base64,/, ''), 'base64'))
                
                // Stitch frames together
                canvas.width = width * cols
                canvas.height = height * rows
                await Promise.all(gif.frames.map(async (frame, i) => {
                    const [imageData, offsetLeft, offsetTop] =
                        await gif.toImageData(i)
                    ctx.putImageData(imageData,
                        (i % cols) * width + offsetLeft,
                        Math.floor(i / cols) * height + offsetTop)
                }))
                file = Buffer.from(canvas.toDataURL()
                    .replace(/^data:image\/\w+;base64,/, ''), 'base64')
            } else {
                await fs.writeFile(path.join(assetsPath, asset.thumbnail), file)
            }

            Object.assign(asset, { rows, cols, numFrames, delay })
        }
        
        await fs.writeFile(path.join(assetsPath, asset.location), file)
        delete asset.filepath
    })
})

ipcRenderer.on('add puppets', async (e, characters, assets, oldAssetsPath, newAssetsPath, thumbnailsPath, puppetsStatusId, assetsStatusId) => {
    await fs.ensureDir(newAssetsPath)
    await Promise.all(Object.keys(characters).map(async id => {
        const character = characters[id]

        // Copy thumbnails over to this project
        if (await fs.exists(character.thumbnail))
            await fs.copy(character.thumbnail, 
                `${path.join(thumbnailsPath, `new-${id}.png`)}`)

        if (await fs.exists(character.thumbFolder))
            await fs.copy(character.thumbFolder,
                `${path.join(thumbnailsPath, `new-${id}`)}`)
    }))

    await addAssets(assets, assetsStatusId, async (asset, assetId) => {
        // Copy the files over
        const newLocation = `${assetId.replace(':', '/')}.${asset.location.slice(-3)}`
        const newThumbnailLocation = `${assetId.replace(':', '/')}.thumb.${asset.location.slice(-3)}`

        await fs.copy(path.join(oldAssetsPath, asset.location),
            path.join(newAssetsPath, newLocation))
        asset.location = newLocation
        if (asset.thumbnail) {
            await fs.copy(path.join(oldAssetsPath, asset.thumbnail),
                path.join(newAssetsPath, newThumbnailLocation))
            asset.thumbnail = newThumbnailLocation
        }

        // Check for completed puppets
        Object.keys(characters).map(id => {
            const character = characters[id]
            const assets = character.assets
            const index = assets.indexOf(assetId)

            if (index > -1) {
                assets.splice(index, 1)

                if (assets.length === 0) {
                    // We finished all the assets for this character, so we'll remove its temp values,
                    // send it to the foreground window, and remove it from our characters list
                    delete character.thumbnail
                    delete character.thumbFolder
                    delete character.assets
                    ipcRenderer.send('foreground', 'import puppet', id, character, puppetsStatusId)
                    delete characters[id]
                }
            }
        })
    })
})
