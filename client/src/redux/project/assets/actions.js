// We split up certain modules into reducers and actions due to some issues
//  with circular dependencies when creating the reducers

import util from '../../util.js'
import { warn } from '../../status'
import { changeCharacter } from '../characters/actions'
import { addFolder, removeFolder } from '../folders'
import { changeLayer, setLayers as setEditorLayers } from '../../editor/layers'
import { SET, ADD, REMOVE, EDIT, getNewAssetID, getConflicts } from './reducers'

const fs = window.require('fs-extra')
const path = require('path')
const {remote, ipcRenderer} = window.require('electron')
const settingsManager = remote.require('./main-process/settings')

// Action Creators
export function addAssets(assets) {
    return (dispatch, getState) => {
        dispatch({ type: ADD, assets })

        let folders = getState().project.folders
        Object.values(assets).forEach(asset => {
            if (!folders.includes(asset.tab)) {
                dispatch(addFolder(asset.tab))
                folders = [...folders, asset.tab]
            }
        })
    }
}

export function duplicateAsset(asset) {
    return (dispatch, getState) => {
        const id = getNewAssetID()
        const {assets, project, settings} = getState().project

        if (!(asset in assets)) {
            warn("Cannot duplicate asset because asset does not exist.")
            return
        }

        const newAsset = util.updateObject(assets[asset], {
            location: path.join(settingsManager.settings.uuid, `${id}.png`),
            panning: [],
            version: 0,
            name: `${assets[asset].name} (copy)`
        })
        
        dispatch({
            type: ADD,
            assets: {
                [`${settingsManager.settings.uuid}:${id}`]: newAsset
            }
        })

        const assetsPath = path.join(project, settings.assetsPath)
        fs.copySync(path.join(assetsPath, assets[asset].location),
            path.join(assetsPath, newAsset.location))
    }
}

export function deleteAssets(ids) {
    return (dispatch, getState) => {
        dispatch({ type: REMOVE, ids })

        // Checks if the given layers contain the removed asset,
        // and if so return a modified version without said asset
        const {project, editor} = getState()
        const {assets, characters} = project
        function handleLayers(layers) {
            let dirty = false            
            const layerFilter = asset => {
                const removed = ids.includes(asset.id)
                if (removed) dirty = true
                return !removed
            }
            const parseLayer = layer => {
                if (layer.children) {
                    return util.updateObject(layer, {
                        children: layer.children.filter(layerFilter).map(parseLayer)
                    })
                }
                return layer
            }

            const oldLayers = {
                children: layers.children.filter(layerFilter).map(parseLayer)
            }

            return dirty ? oldLayers : null
        }

        // Edit any asset bundles with the removed asset
        Object.keys(assets).filter(a => assets[a].type === 'bundle').forEach(asset => {
            const layers = handleLayers(assets[asset].layers)
            if (layers)
                dispatch({ type: EDIT, id: asset, asset: { layers } })
        })

        // Edit any characters with the removed asset
        Object.keys(characters).forEach(character => {
            const layers = handleLayers(characters[character].layers)
            if (layers)
                dispatch(changeCharacter(character, { layers }))
        })

        // Edit the open puppet in the editor, if it exists
        if (editor.type === 'puppet' && editor.id in characters) {
            const layers = handleLayers(editor.layers)
            if (layers)
                dispatch(setEditorLayers(layers))
        }
    }
}

export function deleteTab(tab) {
    return (dispatch, getState) => {
        const assets = getState().project.assets
        const ids = Object.keys(assets).filter(id => assets[id].tab === tab)
        dispatch(deleteAssets(ids))
        dispatch(removeFolder(tab))
    }
}

export function setLayers(asset, layers) {
    return (dispatch, getState) => {
        const state = getState()
        const {project, assets, settings} = state.project

        if (!(asset in assets)) {
            warn("Cannot modify asset because asset does not exist.")
            return
        }

        dispatch({ type: EDIT, id: asset, asset: {
            layers,
            conflicts: getConflicts(assets, layers),
            version: assets[asset].version + 1
        }})

        const thumbnailPath = path.join(project, settings.assetsPath,
            state.self, `${asset.split(':')[1]}`)
        ipcRenderer.send('background', 'generate thumbnails', thumbnailPath,
            { layers }, 'asset', asset)
    }
}

export function renameAsset(id, name) {
    return (dispatch, getState) => {
        const assets = getState().project.assets
        if (!(id in assets)) {
            warn("Cannot modify asset because asset does not exist.")
            return
        }

        dispatch({
            type: EDIT,
            id,
            asset: {
                name,
                version: assets[id].version + 1
            }
        })
    }
}

export function moveAsset(id, tab) {
    return (dispatch, getState) => {
        const { assets, folders } = getState().project

        if (!(id in assets)) {
            warn("Cannot modify asset because asset does not exist.")
            return
        }

        dispatch({
            type: EDIT,
            id,
            asset: {
                tab,
                version: assets[id].version + 1
            }
        })

        if (!folders.includes(tab))
            dispatch(addFolder(tab))
    }
}

export function createAssetBundle(path, name, tab) {
    return (dispatch, getState) => {
        const state = getState()
        const {project, assets, settings} = state.project
        const self = state.self
        const id = `${self}:${getNewAssetID()}`

        // Replace Editor layers with the asset bundle
        let curr = state.editor.present.layers
        for (let i = 0; i < path.length - 1; i++) {
            curr = curr.children[path[i]]
            if (curr.children == null || curr.children.length <= path[i]) {
                dispatch(warn("Unable to convert that layer into an asset bundle: Layer not found."))
                return
            }
        }
        const children = curr.children.slice()
        const index = path[path.length - 1]
        curr = children[index] = util.updateObject(children[index], { id })
        const layers = { children: curr.children }
        delete curr.children

        dispatch(changeLayer(path.slice(0, -1), { children }))

        // Create Asset Bundle
        const thumbnailPath = path.join(project, settings.assetsPath,
            self, `${id.split(':')[1]}`)
        ipcRenderer.send('background', 'generate thumbnails', thumbnailPath,
            { layers }, 'asset', id)

        dispatch(addAssets({
            [id]: {
                name,
                tab,
                layers,
                location: `${self}/${id.split(':')[1]}.png`,
                type: 'bundle',
                conflicts: getConflicts(assets, layers)
            }
        }))
    }
}

export function updateThumbnail(id, thumbnailsPath) {
    return (dispatch, getState) => {
        const assets = getState().project.assets
        if (!(id in assets)) {
            warn("Cannot modify asset because asset does not exist.")
            return
        }

        const asset = assets[id]
        dispatch({ type: EDIT, id, asset: {
            location: `${thumbnailsPath.split('/').slice(-2).join('/')}.png`,
            version: asset.version + 1
        }})
    }
}