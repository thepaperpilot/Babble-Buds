// We split up certain modules into reducers and actions due to some issues
//  with circular dependencies when creating the reducers

import util from '../../util.js'
import { warn, info } from '../../status'
import { close } from '../../editor/editor'
import { changeCharacter } from '../characters/actions'
import { addFolder, removeFolder } from '../folders'
import { changeLayer, setLayers as setEditorLayers } from '../../editor/layers'
import { SET, ADD, REMOVE, EDIT, getNewAssetID, getConflicts } from './reducers'
import { emit } from '../../networking'

const fs = window.require('fs-extra')
const path = require('path')
const {ipcRenderer} = window.require('electron')

// Action Creators
export function addAssets(assets, updateBackground = true) {
    return (dispatch, getState) => {
        const state = getState()
        dispatch({ type: ADD, assets })

        if (updateBackground) {
            dispatch(info('Updating assets in background process...'))
            ipcRenderer.send('background', 'update assets', util.updateObject(state.project.assets, assets), state.project.settings.assetsPath)
        }

        let folders = state.project.folders
        Object.values(assets).forEach(asset => {
            if (!folders.includes(asset.tab)) {
                dispatch(addFolder(asset.tab))
                folders = [...folders, asset.tab]
            }
        })

        Object.keys(assets).forEach(id => {
            dispatch(emit('add asset', id, assets[id]))
        })
    }
}

export function duplicateAsset(asset) {
    return (dispatch, getState) => {
        const id = getNewAssetID()
        const state = getState()
        const {assets, project, settings} = state.project

        if (!(asset in assets)) {
            dispatch(warn("Cannot duplicate asset because asset does not exist."))
            return
        }

        const newAsset = util.updateObject(assets[asset], {
            location: path.join(state.self, `${id}.png`),
            panning: [],
            version: 0,
            name: `${assets[asset].name} (copy)`
        })
        
        dispatch(addAssets({
            [`${state.self}:${id}`]: newAsset
        }))

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
        if (editor.present.type === 'puppet') {
            const layers = handleLayers(editor.present.layers)
            if (layers)
                dispatch(setEditorLayers(layers))
        }

        // Close the editor if any of the deleted assets
        //  was an asset bundle open inside it
        if (editor.present.type === 'asset' &&
            ids.includes(editor.present.id))
            dispatch(close())

        ids.forEach(id => {
            dispatch(emit('delete asset', id))
        })
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
            dispatch(warn("Cannot modify asset because asset does not exist."))
            return
        }

        const newAsset = {
            layers,
            conflicts: getConflicts(assets, layers),
            version: assets[asset].version + 1
        }
        dispatch({ type: EDIT, id: asset, asset: newAsset})

        dispatch(info('Updating assets in background process...'))
        const newAssets = util.updateObject(assets, {
            [asset]: util.updateObject(assets[asset], newAsset)
        })
        ipcRenderer.send('background', 'update assets', newAssets, settings.assetsPath)

        const thumbnailPath = path.join(project, settings.assetsPath,
            state.self, `${asset.split(':')[1]}`)
        ipcRenderer.send('background', 'generate thumbnails', thumbnailPath,
            { layers }, 'asset', asset)

        dispatch(emit('add asset', asset, util.updateObject(assets[asset], newAsset)))
    }
}

export function renameAsset(id, name) {
    return (dispatch, getState) => {
        const assets = getState().project.assets
        if (!(id in assets)) {
            dispatch(warn("Cannot modify asset because asset does not exist."))
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

        dispatch(emit('add asset', id, util.updateObject(assets[id], {
            name,
            version: assets[id].version + 1
        })))
    }
}

export function moveAsset(id, tab) {
    return (dispatch, getState) => {
        const { assets, folders } = getState().project

        if (!(id in assets)) {
            dispatch(warn("Cannot modify asset because asset does not exist."))
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

        dispatch(emit('add asset', id, util.updateObject(assets[id], {
            tab,
            version: assets[id].version + 1
        })))

        if (!folders.includes(tab))
            dispatch(addFolder(tab))
    }
}

export function createAssetBundle(layerPath, name, tab) {
    return (dispatch, getState) => {
        const state = getState()
        const {project, assets, settings} = state.project
        const self = state.self
        const id = `${self}:${getNewAssetID()}`

        // Replace Editor layers with the asset bundle
        let curr = state.editor.present.layers
        for (let i = 0; i < layerPath.length - 1; i++) {
            curr = curr.children[layerPath[i]]
            if (curr.children == null || curr.children.length <= layerPath[i]) {
                dispatch(warn("Unable to convert that layer into an asset bundle: Layer not found."))
                return
            }
        }
        const children = curr.children.slice()
        const index = layerPath[layerPath.length - 1]
        if (children[index] == null) {
            dispatch(warn("Unable to convert that layer into an asset bundle: Layer not found."))
            return
        }
        let layers
        if ('id' in children[index]) {
            layers = { children: [ children[index] ] }
            children[index] = { id }
        } else {
            layers = curr.children[index]
            children[index] = util.updateObject(children[index], { id })
            delete children[index].children
        }

        dispatch(changeLayer(layerPath.slice(0, -1), { children }))

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
        const { project, settings, assets } = getState().project
        if (!(id in assets)) {
            dispatch(warn("Cannot modify asset because asset does not exist."))
            return
        }

        const asset = assets[id]
        dispatch({ type: EDIT, id, asset: {
            location: `${path.relative(path.join(project, settings.assetsPath), thumbnailsPath)}.png`,
            version: asset.version + 1
        }})
    }
}
