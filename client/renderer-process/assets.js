// Imports
const controller = require('./controller')
const editor = require('./editor')
const network = require('./network')

const electron = require('electron')
const remote = electron.remote
const path = require('path')
const sizeOf = require('image-size')
const fs = require('fs-extra')

const settings = remote.require('./main-process/settings')

let project
let asset // asset being moved (outside of pixi)
let assetTabs = [] // list of asset tabs
let importing  // used for importing assets from other projects

exports.init = function() {
    project = remote.getGlobal('project').project
    window.addEventListener('mouseup', mouseUp, false)

    // Update Editor
    let tabs = document.getElementById('asset list')
    let tabsList = document.getElementById('asset tabs')
    let keys = Object.keys(project.assets)
    assetTabs = []
    for (let i = 0; i < keys.length; i++) {
        if (assetTabs.indexOf(project.assets[keys[i]].tab) === -1) {
            assetTabs.push(project.assets[keys[i]].tab)
        }
    }
    for (let i = 0; i < assetTabs.length; i++) {
        let tabElement = document.createElement('div')
        let tabOption = document.createElement('option')
        tabOption.text = assetTabs[i]
        tabOption.id = "tab option " + assetTabs[i]
        tabsList.add(tabOption)
        tabs.appendChild(tabElement)
        tabElement.style.display = 'none'
        tabElement.style.height = '100%'
        tabElement.id = 'tab ' + assetTabs[i]
        tabElement.className = 'scroll'
    }
    for (let i = 0; i < keys.length; i++) {
        exports.addAsset(keys[i], project.assets[keys[i]])
    }
    if (assetTabs[0])
        document.getElementById('tab ' + assetTabs[0]).style.display = ''

    document.getElementById('add-asset').addEventListener('click', addAsset)
    document.getElementById('add-animated-asset').addEventListener('click', addAnimatedAsset)
    document.getElementById('import-asset').addEventListener('click', importAssets)
    document.getElementById('import-all').addEventListener('click', toggleImportAll)
    document.getElementById('import-assets-btn').addEventListener('click', confirmImportAssets)
    document.getElementById('cancel-import-assets').addEventListener('click', controller.openModal)
    document.getElementById('new-asset-bundle').addEventListener('click', () => {
        status.log('Not Yet Implemented!', 1, 1)
    })
    document.getElementById('edit-asset-list').addEventListener('click', editAssetList)
    document.getElementById('asset-list-name').addEventListener('change', renameAssetList)
    document.getElementById('delete-asset-list').addEventListener('click', deleteAssetList)
    document.getElementById('new-asset-list').addEventListener('click', newAssetList)
    document.getElementById('asset selected').addEventListener('click', exports.selectAsset)
    for (let i = 0; i < assetTabs.length; i++) {
        let tabOption = document.createElement('option')
        tabOption.text = assetTabs[i]
        tabOption.id = 'asset-tab option ' + assetTabs[i]
        document.getElementById('asset-tab').add(tabOption)
    }
    document.getElementById('asset-tab').addEventListener('change', migrateAsset)
    document.getElementById('asset-name').addEventListener('change', renameAsset)
    document.getElementById('asset-type').addEventListener('change', assetType)
    document.getElementById('animation-rows').addEventListener('change', animationRows)
    document.getElementById('animation-cols').addEventListener('change', animationCols)
    document.getElementById('animation-numFrames').addEventListener('change', animationFrames)
    document.getElementById('animation-delay').addEventListener('change', animationDelay)
    document.getElementById('duplicate-asset').addEventListener('click', duplicateAsset)
    document.getElementById('replace-asset').addEventListener('click', replaceAsset)
    document.getElementById('delete-asset').addEventListener('click', deleteAsset)
    document.getElementById('asset tabs').addEventListener('change', changeAssetTabs)
    document.getElementById('asset search').addEventListener('keyup', updateAssetSearch)
    document.getElementById('asset search').addEventListener('search', updateAssetSearch)
}



exports.addAsset = function(id) {
    let asset = project.assets[id]
    while (document.getElementsByClassName(id)[0]) {
        let element = document.getElementsByClassName(id)[0]
        element.parentNode.removeChild(element)
    }
    let assetElement = document.createElement('div')
    if (!document.getElementById('tab ' + asset.tab)) addAssetListToDom(asset.tab)
    document.getElementById('tab ' + asset.tab).appendChild(assetElement)
    assetElement.id = asset.name.toLowerCase()
    assetElement.className = "asset " + id
    assetElement.innerHTML = '<div class="desc">' + asset.name + '</div>'
    let assetDraggable = document.createElement('img')
    assetElement.appendChild(assetDraggable)
    assetDraggable.asset = id
    assetDraggable.style.height = assetDraggable.style.width = '120px'
    assetDraggable.className = 'contain'
    // Asset types with thumbnails
    if (asset.type === "animated" || asset.type === "bundle") {
        let location = asset.location
        location = [location.slice(0, location.length - 4), '.thumb', location.slice(location.length - 4)].join('')
        assetDraggable.src = path.join(project.assetsPath, location + "?random=" + new Date().getTime())
        assetElement.className += ' ' + asset.type
    } else {
        assetDraggable.src = path.join(project.assetsPath, asset.location + "?random=" + new Date().getTime())
    }
    if (id.split(':')[0] !== settings.settings.uuid) {
        assetElement.className += ' downloaded'
    }
    assetDraggable.addEventListener('mousedown', mouseDown, false)
    if (document.getElementById('asset-name').asset === id) {
        openAssetSettings(id)
    }
}

exports.reloadAssets = function() {
    // Update Assets
    let tabs = document.getElementById('asset list')
    let tabsList = document.getElementById('asset tabs')
    let keys = Object.keys(project.assets)
    assetTabs = []
    tabs.innerHTML = ''
    tabsList.innerHTML = ''
    for (let i = 0; i < keys.length; i++) {
        if (assetTabs.indexOf(project.assets[keys[i]].tab) === -1) {
            assetTabs.push(project.assets[keys[i]].tab)
        }
    }
    for (let i = 0; i < assetTabs.length; i++) {
        let tabElement = document.createElement('div')
        let tabOption = document.createElement('option')
        tabOption.text = assetTabs[i]
        tabOption.id = "tab option " + assetTabs[i]
        tabsList.add(tabOption)
        tabs.appendChild(tabElement)
        tabElement.style.display = 'none'
        tabElement.style.height = '100%'
        tabElement.id = 'tab ' + assetTabs[i]
        tabElement.className = 'scroll'
    }
    for (let i = 0; i < keys.length; i++) {
        exports.addAsset(keys[i], project.assets[keys[i]])
    }
    if (assetTabs[0])
        document.getElementById('tab ' + assetTabs[0]).style.display = ''

    // Update Puppet
    editor.setPuppet(JSON.parse(JSON.stringify(project.characters[editor.character.id])), true)
    editor.savePuppet()
}

exports.renameAssetList = function(tab, newTab) {
    document.getElementById('tab ' + tab).id = 'tab ' + newTab
    document.getElementById('tab option ' + tab).text = newTab
    document.getElementById('tab option ' + tab).id = 'tab option ' + newTab
    document.getElementById('asset-tab option ' + tab).text = newTab
    document.getElementById('asset-tab option ' + tab).id = 'asset-tab option ' + newTab
    document.getElementById('asset-list-name').tab = newTab
    document.getElementById('delete-asset-list').tab = newTab
    assetTabs[assetTabs.indexOf(tab)] = newTab
}

exports.deleteAssetList = function(tab) {
    document.getElementById('asset list').removeChild(document.getElementById('tab ' + tab))
    document.getElementById('asset tabs').removeChild(document.getElementById('tab option ' + tab))
    document.getElementById('asset-tab').removeChild(document.getElementById('asset-tab option ' + tab))
    assetTabs.splice(assetTabs.indexOf(tab), 1)
    if (assetTabs[0])
        document.getElementById('tab ' + assetTabs[0]).style.display = ''
    document.getElementById('assets').style.display = ''
    document.getElementById('asset list editor').style.display = 'none'
}

exports.reloadAsset = function(id) {
    let asset = project.assets[id]
    let assetElement = document.getElementById('tab ' + asset.tab).getElementsByClassName(id)[0]
    assetElement.className = 'asset ' + id
    assetElement.id = asset.name.toLowerCase()
    assetElement.childNodes[0].innerHTML = asset.name
    let assetDraggable = assetElement.childNodes[1]
    if (asset.type === "animated" || asset.type === "bundle") {
        let location = asset.location
        location = [location.slice(0, location.length - 4), '.thumb', location.slice(location.length - 4)].join('')
        assetDraggable.src = path.join(project.assetsPath, location + "?random=" + new Date().getTime())
        assetElement.className += ' ' + asset.type
    } else {
        assetDraggable.src = path.join(project.assetsPath, asset.location + "?random=" + new Date().getTime())
    }
    if (id.split(':')[0] !== settings.settings.uuid) {
        assetElement.className += ' downloaded'
    }

    if (document.getElementById('asset-name').asset === id) {
        openAssetSettings(id)
    }
}

exports.selectAsset = function() {
    document.getElementById('assets').style.display = ''
    document.getElementById('asset editor').style.display = 'none'
    document.getElementById('asset selected').style.display = 'none'
}

exports.checkLayer = function(layer, assets, characterPath) {
    for (let k = 0; k < layer.length; k++) {
        let asset = layer[k]
        // If we don't have the tab or the asset...
        if (!project.assets[asset.id]) {
            // Add it!
            importAsset({id: asset.id, asset: assets[asset.id], location: path.join(characterPath, '..', '..', 'assets', assets[asset.id].location)})
        }
    }
}

function mouseUp(e) {
    if (asset) {
        if (asset.dragging || asset.clicked) {
            let rect = document.getElementById('editor-screen').getBoundingClientRect()
            if (rect.left < e.clientX && rect.right > e.clientX && rect.top < e.clientY && rect.bottom > e.clientY) {
                editor.placeAsset(asset, (e.clientX - rect.left - rect.width / 2), (e.clientY - rect.bottom))
            } 
            if (!e.shiftKey) {
                window.removeEventListener('mousemove', moveAsset, true);
                asset.style.position = 'static'
                asset.style.cursor = ''
                asset.style.top = asset.style.left = ""
                asset.style.width = asset.style.height = 120 + "px"
                asset.style.zIndex = ''
                asset = null
            }
        } else asset.clicked = true
    }
}

function mouseDown(e) {
    if (asset) return
    if (e.button === 0) {
        asset = e.target
        asset.dragging = asset.clicked = false
        asset.style.zIndex = '2'
        asset.style.position = 'fixed'
        asset.style.cursor = 'none'
        asset.style.width = asset.style.height = 'unset'
        asset.style.width = asset.width * editor.scale + "px"
        asset.style.top = (e.clientY - asset.height / 2) + 'px'
        asset.style.left = (e.clientX - asset.width / 2) + 'px'
        e.preventDefault()
        window.addEventListener('mousemove', moveAsset, true);
    } else if (project.assets[e.target.asset].type === "bundle") {
        status.info("Opening bundle " + e.target.asset)
        editor.setBundle(e.target.asset)
    } else {
        status.info("Opening asset " + e.target.asset)
        openAssetSettings(e.target.asset)
    }
}

function addAsset() {
    if (document.getElementById('asset tabs').value === '') {
        status.log("Error: You must have an asset list to add assets", 5, 1)
        return
    }
    remote.dialog.showOpenDialog(remote.BrowserWindow.getFocusedWindow(), {
        title: 'Add Assets',
        filters: [
          {name: 'Image', extensions: ['png']}
        ],
        properties: [
          'openFile',
          'multiSelections'
        ] 
    }, (filepaths) => {
        if (!filepaths) return
        for (let i = 0; i < filepaths.length; i++) {
            let file = fs.readFileSync(filepaths[i])
            let name = filepaths[i].replace(/^.*[\\\/]/, '').replace(/.png/, '')
            let id = project.getNewAssetId()
            let tab = document.getElementById('asset tabs').value
            fs.ensureDirSync(path.join(project.assetsPath, settings.settings.uuid))
            fs.writeFileSync(path.join(project.assetsPath, settings.settings.uuid, id + '.png'), file)
            controller.addAsset(settings.settings.uuid + ":" + id, {
                "tab": tab, 
                "type": "sprite", 
                "version": 0,
                "panning": [],
                "name": name, 
                "location": path.join(settings.settings.uuid, id + '.png')
            })
        }
    })
}

function addAnimatedAsset() {
    if (document.getElementById('asset tabs').value === '') {
        status.log("Error: You must have an asset list to add assets", 5, 1)
        return
    }
    remote.dialog.showOpenDialog(remote.BrowserWindow.getFocusedWindow(), {
        title: 'Add Animated Assets',
        filters: [
          {name: 'Animated Image', extensions: ['gif']},
          {name: 'Animated Spritesheet', extensions: ['png']}
        ],
        properties: [
          'openFile',
          'multiSelections'
        ] 
    }, (filepaths) => {
        if (!filepaths) return
        for (let i = 0; i < filepaths.length; i++) {
            let file = fs.readFileSync(filepaths[i])
            let name = filepaths[i].replace(/^.*[\\\/]/, '').replace(/.png/, '').replace(/.gif/, '')
            let rows = 1
            let cols = 1
            let numFrames = 1
            let delay = 60
            if (filepaths[i].substr(filepaths[i].length - 4) === ".gif") {
                // If gif, turn it into animated png spritesheet
                let gif = new GIF(file)
                let frames = gif.decompressFrames(true)
                numFrames = frames.length
                delay = frames[0].delay
                // Optimize rows and columns to make an approximately square sheet
                // (idk if this is useful but figured it wouldn't hurt)
                rows = Math.ceil(Math.sqrt(frames.length))
                cols = Math.ceil(frames.length / rows)
                let width = gif.raw.lsd.width
                let height = gif.raw.lsd.height
                // Create canvas to put each frame onto
                var canvas = document.createElement('canvas')
                var ctx = canvas.getContext('2d')
                canvas.width = width * cols
                canvas.height = height * rows
                for (let j = 0; j < rows; j++) {
                    for (let k = 0; k < cols; k++) {
                        if (numFrames <= j * cols + k) break
                        let frame = frames[j * cols + k]
                        let imageData = ctx.createImageData(frame.dims.width, frame.dims.height)
                        imageData.data.set(frame.patch)
                        ctx.putImageData(imageData, k * width + frame.dims.left, j * height + frame.dims.top)
                    }
                }
                file = new Buffer(canvas.toDataURL().replace(/^data:image\/\w+;base64,/, ""), 'base64')
            }
            let id = project.getNewAssetId()
            let tab = document.getElementById('asset tabs').value
            fs.ensureDirSync(path.join(project.assetsPath, settings.settings.uuid))
            fs.writeFileSync(path.join(project.assetsPath, settings.settings.uuid, id + '.png'), file)
            if (numFrames === 1) fs.copySync(path.join(project.assetsPath, settings.settings.uuid, id + '.png'), path.join(project.assetsPath, settings.settings.uuid, id + '.thumb.png'))
            else if (fs.existsSync(path.join(project.assetsPath, settings.settings.uuid, id + '.thumb.png')))
                fs.remove(path.join(project.assetsPath, settings.settings.uuid, id + '.thumb.png'))
            controller.addAsset(settings.settings.uuid + ":" + id, {
                "tab": tab, 
                "type": "animated", 
                "version": 0,
                "padding": [],
                "name": name, 
                "rows": rows, 
                "cols": cols, 
                "numFrames": numFrames, 
                "delay": delay, 
                "location": path.join(settings.settings.uuid, id + '.png')
            })
        }
    })
}

function importAssets() {
    remote.dialog.showOpenDialog(remote.BrowserWindow.getFocusedWindow(), {
        title: 'Select Project',
        defaultPath: path.join(remote.app.getPath('home'), 'projects'),
        filters: [
            {name: 'Babble Buds Project File', extensions: ['babble']},
            {name: 'All Files', extensions: ['*']}
        ],
        properties: [
            'openFile'
        ] 
        }, (filepaths) => {
            if (filepaths) {
                fs.readJson(filepaths[0], (err, project) => {
                    if (err) console.log(err)
                    importing = {}
                    controller.openModal("#importAssets")
                    document.getElementById('import-all').checked = false
                    let assetsList = document.getElementById('import-assets')
                    assetsList.innerHTML = ''
                    let readAssetList = function(name, list) {
                        if (err) console.log(err)
                        let tab = document.createElement('div')
                        let addAll = document.createElement('input')
                        tab.appendChild(addAll)
                        addAll.outerHTML = '<hr><input type="checkbox" id="import-all-' + name + '" class="checkbox"><label for="import-all-' + name + '" class="checkbox-label">' + name + '</label><br/>'
                        let keys = Object.keys(list)
                        for (let i = 0; i < keys.length; i++) {
                            let asset = document.createElement('div')
                            asset.id = 'import-asset-' + keys[i]
                            asset.asset = keys[i]
                            asset.assetData = list[keys[i]]
                            asset.location = path.join(filepaths[0], '..', 'assets', list[keys[i]].location)
                            asset.className = "asset"
                            asset.innerHTML = '<div class="desc">' + list[keys[i]].name + '</div>'
                            if (list[keys[i]].type === "animated") {
                                let location = list[keys[i]].location
                                location = [location.slice(0, location.length - 4), '.thumb', location.slice(location.length - 4)].join('')
                                asset.style.backgroundImage = 'url(' + path.join(filepaths[0], '..', 'assets', location + '?random=' + new Date().getTime()).replace(/\\/g, '/') + ')'
                                asset.className += ' animated'
                            } else 
                                asset.style.backgroundImage = 'url(' + path.join(filepaths[0], '..', 'assets', list[keys[i]].location + '?random=' + new Date().getTime()).replace(/\\/g, '/') + ')'
                            asset.addEventListener('click', toggleImportAsset)
                            tab.appendChild(asset)
                        }
                        assetsList.appendChild(tab)
                        document.getElementById('import-all-' + this).addEventListener('click', toggleImportList)
                    }
                    if (project.assets) {
                        let numAssets = 0
                        let callback = function(err, list) {
                            // "this" refers to the name of the asset list
                            if (err) console.log(err)
                            let keys = Object.keys(list)
                            let assets = {}
                            for (let j = 0; j < keys.length; j++) {
                                list[keys[j]].tab = this.valueOf()
                                list[keys[j]].version = 0
                                list[keys[j]].panning = []
                                assets["invalid:" + numAssets] = list[keys[j]]
                                numAssets++
                            }
                            readAssetList(this.valueOf(), assets)
                        }
                        for (let i = 0; i < project.assets.length; i++) {
                            fs.readJson(path.join(filepaths[0], '..', 'assets', project.assets[i].location), callback.bind(project.assets[i].name))
                        }
                    } else {
                        fs.readJson(path.join(filepaths[0], '..', 'assets', "assets.json"), (err, list) => {
                            let assetLists = {}
                            let keys = Object.keys(list)
                            for (let i = 0; i < keys.length; i++) {
                                if (!assetLists[list[keys[i]].tab]) {
                                    assetLists[list[keys[i]].tab] = {}
                                }
                                assetLists[list[keys[i]].tab][keys[i]] = list[keys[i]]
                            }
                            keys = Object.keys(assetLists)
                            for (let i = 0; i < keys.length; i++) {
                                readAssetList(keys[i], assetLists[keys[i]])
                            }
                        })
                    }
                })
            }
        }
    )
}

function toggleImportAll(e) {
    let importAll = e.target.checked
    let assetList = document.getElementById('import-assets')
    for (let i = 0; i < assetList.childNodes.length; i++) {
        let list = assetList.childNodes[i]
        list.childNodes[1].checked = importAll
        // First four are hr, checkbox, label, and br
        for (let j = 4; j < list.childNodes.length; j++) {
            let asset = list.childNodes[j]
            if ((asset.className === "asset selected") != importAll) {
                toggleImportAsset({target: asset})
            }
        }
    }
}

function toggleImportList(e) {
    let importAll = e.target.checked
    for (let i = 4; i < e.target.parentNode.childNodes.length; i++) {
        let asset = e.target.parentNode.childNodes[i]
        if ((asset.className === "asset selected") != importAll) {
            toggleImportAsset({target: asset})
        }
    }
}

function toggleImportAsset(e) {
    if (e.target.className === 'asset selected' || e.target.className === 'asset selected animated') {
        e.target.className = 'asset' + (e.target.asset.type === "animated" ? " animated" : "")
        delete importing[e.target.id]
        e.target.parentNode.childNodes[1].checked = false
        document.getElementById('import-all').checked = false
    } else {
        e.target.className = 'asset selected' + (e.target.asset.type === "animated" ? " animated" : "")
        importing[e.target.id] = {id: e.target.asset, asset: e.target.assetData, location: e.target.location}
    }
}

function confirmImportAssets() {
    let assets = Object.keys(importing)
    for (let i = 0; i < assets.length; i++) {
        importAsset(importing[assets[i]])
    }
    controller.openModal()
}

function importAsset(asset) {
    fs.ensureDirSync(path.join(project.assetsPath, settings.settings.uuid))
    fs.copySync(asset.location, path.join(project.assetsPath, settings.settings.uuid, asset.id.split(':')[1] + '.png'))
    if (asset.asset.type === 'animated') {
        let location = asset.location
        location = [location.slice(0, location.length - 4), '.thumb', location.slice(location.length - 4)].join('')
        fs.copySync(location, path.join(project.assetsPath, settings.settings.uuid, asset.id.split(':')[1] + '.thumb.png'))
    }
    controller.addAsset(asset.id, asset.asset)
}

function editAssetList() {
    if (Object.keys(project.assets).length === 0) return
    if (document.getElementById('asset list editor').style.display === 'none') {
        document.getElementById('assets').style.display = 'none'
        document.getElementById('asset list editor').style.display = ''
        document.getElementById('asset-list-name').value = document.getElementById('asset tabs').value
        document.getElementById('asset-list-name').tab = document.getElementById('asset tabs').value
        document.getElementById('delete-asset-list').tab = document.getElementById('asset tabs').value
        document.getElementById('edit-asset-list').classList.add('open-tab')
        document.getElementById('asset editor').style.display = 'none'
        document.getElementById('asset selected').style.display = 'none'
    } else {
        document.getElementById('assets').style.display = ''
        document.getElementById('asset list editor').style.display = 'none'
        document.getElementById('edit-asset-list').classList.remove('open-tab')
    }
}

function renameAssetList(e) {
    controller.renameAssetList(e.target.tab, e.target.value)
}

function deleteAssetList(e) {
    controller.deleteAssetList(e.target.tab)
    document.getElementById('edit-asset-list').classList.remove('open-tab')
}

function newAssetList() {
    // Calculate name for new asset list
    let name = "New Asset List", i = 0
    while (assetTabs.indexOf(name) !== -1)
        name = "New Asset List (" + (++i) + ")"
    // Add list to DOM
    addAssetListToDom(name)
    // Select new list
    document.getElementById('asset tabs').value = name
    for (let i = 0; i < assetTabs.length; i++)
        document.getElementById('tab ' + assetTabs[i]).style.display = 'none'
    document.getElementById('tab ' + name).style.display = ''
}

function addAssetListToDom(name) {
    assetTabs.push(name)
    let tabElement = document.createElement('div')
    tabElement.style.height = '100%'
    tabElement.id = 'tab ' + name
    tabElement.style.display = 'none'
    tabElement.className = 'scroll'
    document.getElementById('asset list').appendChild(tabElement)
    let tabOption = document.createElement('option')
    tabOption.text = name
    tabOption.id = "asset-tab option " + name
    document.getElementById('asset-tab').add(tabOption)
    tabOption = document.createElement('option')
    tabOption.text = name
    tabOption.id = "tab option " + name
    document.getElementById('asset tabs').add(tabOption)
}

function migrateAsset(e) {
    let asset = project.assets[e.target.asset]
    asset.tab = e.target.value
    controller.updateAsset(e.target.asset)
}

function renameAsset(e) {
    let asset = project.assets[e.target.asset]
    asset.name = e.target.value
    controller.updateAsset(e.target.asset)
}

function assetType(e) {
    let asset = project.assets[e.target.asset]
    asset.type = e.target.value.toLowerCase()
    if (e.target.value.toLowerCase() === "animated") {
        asset.rows = asset.rows || 1
        asset.cols = asset.cols || 1
        asset.numFrames = asset.numFrames || 1
        asset.delay = asset.delay || 60
        let location = asset.location
        location = [location.slice(0, location.length - 4), '.thumb', location.slice(location.length - 4)].join('')
        if (!fs.existsSync(path.join(project.assetsPath, location))) {
            fs.copySync(path.join(project.assetsPath, asset.location), path.join(project.assetsPath, location))
        }
        document.getElementById('asset selected').style.background = 'url(' + path.join(project.assetsPath, location + "?random=" + new Date().getTime()).replace(/\\/g, '/') + ') center no-repeat/contain'
        document.getElementById('animated-settings').style.display = ''
        document.getElementById('animated-spritesheet').src = path.join(project.assetsPath, asset.location + "?random=" + new Date().getTime()).replace(/\\/g, '/')
        document.getElementById('animation-rows').value = asset.rows
        document.getElementById('animation-cols').value = asset.cols
        document.getElementById('animation-numFrames').value = asset.numFrames
        document.getElementById('animation-delay').value = asset.delay
    } else {
        document.getElementById('asset selected').style.background = 'url(' + path.join(project.assetsPath, asset.location + "?random=" + new Date().getTime()).replace(/\\/g, '/') + ') center no-repeat/contain'
        document.getElementById('animated-settings').style.display = 'none'
    }
    controller.updateAsset(e.target.asset)
}

function animationRows(e) {
    let asset = project.assets[e.target.asset]
    asset.rows = e.target.value
    controller.updateAsset(e.target.asset)
    recreateThumb(asset)
}

function animationCols(e) {
    let asset = project.assets[e.target.asset]
    asset.cols = e.target.value
    controller.updateAsset(e.target.asset)
    recreateThumb(asset)
}

function animationFrames(e) {
    let asset = project.assets[e.target.asset]
    asset.numFrames = e.target.value
    controller.updateAsset(e.target.asset)
}

function animationDelay(e) {
    let asset = project.assets[e.target.asset]
    asset.delay = e.target.value
    controller.updateAsset(e.target.asset)
}

function recreateThumb(asset) {
    let location = asset.location
    location = [location.slice(0, location.length - 4), '.thumb', location.slice(location.length - 4)].join('')
    let dimensions = sizeOf(path.join(project.assetsPath, asset.location))
    let width = Math.floor(dimensions.width / asset.cols)
    let height = Math.floor(dimensions.height / asset.rows)
    let image = new Image()
    image.onload = () => {
        let canvas = document.createElement('canvas')
        canvas.width = dimensions.width
        canvas.height = dimensions.height
        canvas.getContext('2d').drawImage(image, 0, 0)
        let data = canvas.getContext('2d').getImageData(0, 0, width, height)
        canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').putImageData(data, 0, 0)
        fs.writeFile(path.join(project.assetsPath, location), new Buffer(canvas.toDataURL().replace(/^data:image\/\w+;base64,/, ""), 'base64'), (err) => {
            if (err) console.log(err)
            document.getElementById('asset selected').style.background = 'url(' + path.join(project.assetsPath, location + "?random=" + new Date().getTime()).replace(/\\/g, '/') + ') center no-repeat/contain'
            document.getElementById(asset.name.toLowerCase()).children[1].src = path.join(project.assetsPath, location + "?random=" + new Date().getTime()).replace(/\\/g, '/')
        })
    }
    image.src = path.join(project.assetsPath, asset.location)
}

function duplicateAsset(e) {
    let newAsset = JSON.parse(JSON.stringify(project.assets[e.target.asset]))
    let id = project.getNewAssetId()
    newAsset.location = path.join(settings.settings.uuid, id + ".png")
    newAsset.version = 0
    fs.copySync(path.join(project.assetsPath, project.assets[e.target.asset].location), path.join(project.assetsPath, newAsset.location))
    controller.addAsset(settings.settings.uuid + ":" + id, newAsset)
    exports.selectAsset()
}

function replaceAsset(e) {
    remote.dialog.showOpenDialog(remote.BrowserWindow.getFocusedWindow(), {
        title: 'Replace Asset',
        filters: [
          {name: 'Image', extensions: ['png']}
        ],
        properties: [
          'openFile'
        ] 
    }, (filepaths) => {
        if (!filepaths) return
        let asset = project.assets[e.target.asset]
        let file = fs.readFileSync(filepaths[0])
        fs.writeFileSync(path.join(project.assetsPath, asset.location), file)
        controller.updateAsset(e.target.asset)
    })
}

function deleteAsset(e) {
    if (remote.dialog.showMessageBox({
        "type": "question",
        "buttons": ["Delete Asset", "Cancel"],
        "defaultId": 1,
        "title": "Delete Asset?",
        "message": "Are you sure you want to delete this asset?",
        "detail": "This action cannot be undone.",
        "cancelId": 1
    }) === 0)
        controller.deleteAsset(e.target.asset)
}

function changeAssetTabs(e) {
    for (let i = 0; i < assetTabs.length; i++)
        document.getElementById('tab ' + assetTabs[i]).style.display = 'none'
    document.getElementById('tab ' + e.target.value).style.display = ''
}

function updateAssetSearch(e) {
    for (let i = 0; i < assetTabs.length; i++) {
        let list = document.getElementById('tab ' + assetTabs[i])
        if (e.target.value === '') {
            for (let j = 0; j < list.children.length; j++)
                list.children[j].style.display = ''
        } else {
            for (let j = 0; j < list.children.length; j++)
                list.children[j].style.display = 'none'
            let assetsElements = list.querySelectorAll("[id*='" + e.target.value.toLowerCase() + "']")
            for (let j = 0; j < assetsElements.length; j++) {
                assetsElements[j].style.display = ''
            }
        }
    }
}

function openAssetSettings(id) {
    document.getElementById('assets').style.display = 'none'
    document.getElementById('asset editor').style.display = ''
    document.getElementById('asset selected').style.display = ''
    let asset = project.assets[id]
    let enabled = settings.settings.uuid === id.split(':')[0]
    let elements = ['asset-tab', 'asset-name', 'asset-type', 'replace-asset']
    document.getElementById('asset-type').value = asset.type ? asset.type.charAt(0).toUpperCase() + asset.type.slice(1) : "Sprite"
    if (asset.type === "animated") {
        let location = asset.location
        location = [location.slice(0, location.length - 4), '.thumb', location.slice(location.length - 4)].join('')
        document.getElementById('asset selected').style.background = 'url(' + path.join(project.assetsPath, location + "?random=" + new Date().getTime()).replace(/\\/g, '/') + ') center no-repeat/contain'
        document.getElementById('animated-settings').style.display = ''
        document.getElementById('animated-spritesheet').src = path.join(project.assetsPath, asset.location + "?random=" + new Date().getTime()).replace(/\\/g, '/')
        document.getElementById('animation-rows').value = asset.rows
        document.getElementById('animation-cols').value = asset.cols
        document.getElementById('animation-numFrames').value = asset.numFrames
        document.getElementById('animation-delay').value = asset.delay
        elements = elements.concat(['animation-rows', 'animation-cols', 'animation-numFrames', 'animation-delay'])
    } else {
        document.getElementById('asset selected').style.background = 'url(' + path.join(project.assetsPath, asset.location + "?random=" + new Date().getTime()).replace(/\\/g, '/') + ') center no-repeat/contain'
        document.getElementById('animated-settings').style.display = 'none'
    }
    document.getElementById('asset-tab').value = asset.tab
    document.getElementById('asset-name').value = asset.name
    document.getElementById('duplicate-asset').asset = id
    document.getElementById('delete-asset').asset = id
    document.getElementById('delete-asset').disabled = !enabled && network.isNetworking
    for (let i = 0; i < elements.length; i++) {
        document.getElementById(elements[i]).asset = id
        document.getElementById(elements[i]).disabled = !enabled
    }
}

function moveAsset(e) {
    asset.dragging = true
    asset.style.top = (e.clientY - asset.height / 2) + 'px'
    asset.style.left = (e.clientX - asset.width / 2) + 'px'
}
