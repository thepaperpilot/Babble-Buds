const fs = window.require('fs-extra')
const path = require('path')

const remote = window.require('electron').remote
const settingsManager = remote.require('./main-process/settings')
const util = require('./../util')

export function getNewAssetID() {
    const id = parseInt(settingsManager.settings.numAssets, 10) + 1
    settingsManager.setNumAssets(id)
    settingsManager.save()
    return id
}

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

function deleteAsset(state, action) {
    const assets = util.updateObject(state.assets)
    const characters = util.updateObject(state.characters)
    handleDeleteAsset(assets, characters, action.asset)
    return util.updateObject(state, { assets, characters })
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
    const asset = util.updateObject(state.assets[action.asset], {
        tab: action.tab,
        version: state.assets[action.asset].version + 1
    })
    const assets = util.updateObject(state.assets, { [action.asset]: asset })
    return util.updateObject(state, { assets })
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

    const assets = util.updateObject(state.assets, {
        [`${settingsManager.settings.uuid}:${id}`]: asset
    })
    return util.updateObject(state, { assets })
}

function deleteTab(state, action) {
    const assets = util.updateObject(state.assets)
    const characters = util.updateObject(state.characters)
    Object.keys(state.assets).filter(id =>
        assets[id].tab === action.tab).forEach(asset => {
        handleDeleteAsset(assets, characters, asset)
    })
    return util.updateObject(state, { assets, characters })
}

function addAssets(state, action) {
    const assets = util.updateObject(state.assets, action.assets)
    return util.updateObject(state, { assets })
}

export default {
    'DELETE_ASSET': deleteAsset,
    'RENAME_ASSET': renameAsset,
    'MOVE_ASSET': moveAsset,
    'DUPLICATE_ASSET': duplicateAsset,
    'DELETE_TAB': deleteTab,
    'ADD_ASSETS': addAssets
}
