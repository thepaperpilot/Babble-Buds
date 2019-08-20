const fs = window.require('fs-extra')
const path = require('path')

const {remote, ipcRenderer} = window.require('electron')
const settingsManager = remote.require('./main-process/settings')
const util = require('./../util')

export function getNewAssetID() {
    const id = parseInt(settingsManager.settings.numAssets, 10) + 1
    settingsManager.setNumAssets(id)
    settingsManager.save()
    return id
}

// This function works in-place!
// Apart from id, all these parameters will be modified!
function handleDeleteAsset(assets, characters, id) {
    delete assets[id]
    Object.keys(characters).forEach(char => {
        const character = JSON.parse(JSON.stringify(characters[char]))
        const assetFilter = asset => asset.id !== id
        const parseLayer = layer => {
            if (layer.children) {
                layer.children =
                    layer.children.filter(assetFilter).map(parseLayer)
            }
            return layer
        }

        character.layers = parseLayer(character.layers)
        characters[char] = character
    })
}

// This function returns a new folder!
// No side effects!
function addToFolder(folder, id) {
    const newFolder = util.updateObject(folder, { assets: folder.assets.slice() })
    newFolder.assets.push(id)
    return newFolder
}

// This function returns a new folder!
// No side effects!
function removeFromFolder(folder, id) {
    const newFolder = util.updateObject(folder, { assets: folder.assets.slice() })
    newFolder.assets.splice(folder.assets.indexOf(id), 1)
    return newFolder
}

function deleteAsset(state, action) {
    const assets = util.updateObject(state.assets)
    const characters = util.updateObject(state.characters)
    handleDeleteAsset(assets, characters, action.asset)
    
    const folders = state.settings.folders.slice()
    const index = folders.findIndex(f => f.name === state.assets[action.asset].tab)
    folders[index] = removeFromFolder(folders[index], action.asset)
    
    const settings = util.updateObject(state.settings, { folders })
    return util.updateObject(state, { settings, assets, characters })
}

function renameAsset(state, action) {
    const asset = util.updateObject(state.assets[action.asset], {
        name: action.name,
        version: state.assets[action.asset].version + 1
    })
    const assets = util.updateObject(state.assets, { [action.asset]: asset })
    return util.updateObject(state, { assets })
}

function moveAsset(state, action) {
    // Modify asset
    const asset = util.updateObject(state.assets[action.asset], {
        tab: action.tab,
        version: state.assets[action.asset].version + 1
    })

    // Remove asset from old folder
    const folders = state.settings.folders.slice()
    const oldF = folders.findIndex(f => f.name === state.assets[action.asset].tab)
    folders[oldF] = removeFromFolder(folders[oldF], action.asset)

    // Add asset to new folder
    let newF = folders.findIndex(f => f.name === action.tab)
    if (newF === -1) {
        newF = folders.length
        folders.push({ name: action.tab, assets: [] })
    }
    folders[newF] = addToFolder(folders[newF], action.asset)
    
    const assets = util.updateObject(state.assets, { [action.asset]: asset })
    const settings = util.updateObject(state.settings, { folders })
    return util.updateObject(state, { settings, assets })
}

function duplicateAsset(state, action) {
    const asset = JSON.parse(JSON.stringify(state.assets[action.asset]))
    const id = getNewAssetID()
    asset.location = path.join(settingsManager.settings.uuid, `${id}.png`)
    asset.version = 0
    asset.name = `${asset.name} (copy)`

    const assetsPath = path.join(state.project, state.settings.assetsPath)
    fs.copySync(path.join(assetsPath, state.assets[action.asset].location),
        path.join(assetsPath, asset.location))

    const folders = state.settings.folders.slice()
    const f = folders.findIndex(f => f.name === asset.tab)
    folders[f] = addToFolder(folders[f], `${settingsManager.settings.uuid}:${id}`)

    const assets = util.updateObject(state.assets, {
        [`${settingsManager.settings.uuid}:${id}`]: asset
    })
    const settings = util.updateObject(state.settings, { folders })
    return util.updateObject(state, { settings, assets })
}

function deleteTab(state, action) {
    const assets = util.updateObject(state.assets)
    const characters = util.updateObject(state.characters)
    Object.keys(state.assets).filter(id =>
        assets[id].tab === action.tab).forEach(asset => {
        handleDeleteAsset(assets, null, characters, asset)
    })
    const folders = state.settings.folders.slice()
    folders.splice(folders.findIndex(f => f.name === action.tab), 1)
    const settings = util.updateObject(state.settings, { folders })
    return util.updateObject(state, { settings, assets, characters })
}

function addAssets(state, action) {
    const assets = util.updateObject(state.assets, action.assets)
    const folders = state.settings.folders.slice()
    Object.keys(action.assets).forEach(id => {
        const index = folders.findIndex(f => f.name === action.assets[id].tab)
        folders[index] = addToFolder(folders[index], id)
    })
    const settings = util.updateObject(state.settings, { folders })
    return util.updateObject(state, { settings, assets })
}

function newAssetBundle(state, action) {
    const {id, name, tab, layers, creator} = action
    const thumbnailPath = path.join(state.project, state.settings.assetsPath,
        creator, `${id.split(':')[1]}`)
    ipcRenderer.send('background', 'generate thumbnails', thumbnailPath,
        { layers }, 'asset', id)

    const folders = state.settings.folders.slice()
    const index = folders.findIndex(f => f.name === tab)
    folders[index] = addToFolder(folders[index], id)
    const settings = util.updateObject(state.settings, { folders })

    return addAssets(state, { settings, assets: {
        [id]: {
            name,
            tab,
            layers,
            location: `${creator}/${id.split(':')[1]}.png`,
            panning: [],
            type: 'bundle',
            version: 0
        }
    } })
}

function updateThumbnails(state, action) {
    const asset = util.updateObject(state.assets[action.id], {
        location: `${action.thumbnailsPath.split('/').slice(-2).join('/')}.png`,
        version: state.assets[action.id].version + 1
    })

    const assets = util.updateObject(state.assets, {
        [action.id]: asset
    })
    return util.updateObject(state, { assets })
}

export default {
    'DELETE_ASSET': deleteAsset,
    'RENAME_ASSET': renameAsset,
    'MOVE_ASSET': moveAsset,
    'DUPLICATE_ASSET': duplicateAsset,
    'DELETE_TAB': deleteTab,
    'ADD_ASSETS': addAssets,
    'NEW_ASSET_BUNDLE': newAssetBundle,
    'UPDATE_ASSET_THUMBNAILS': updateThumbnails
}
