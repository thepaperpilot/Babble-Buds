// We split up certain modules into reducers and actions due to some issues
//  with circular dependencies when creating the reducers

import util from '../../util.js'
import { Puppet } from 'babble.js'
import { setFolders } from '../folders'

const {remote} = window.require('electron')
const settingsManager = remote.require('./main-process/settings')

// Action Types
export const SET = 'project/assets/SET'
export const ADD = 'project/assets/ADD'
export const REMOVE = 'project/assets/REMOVE'
export const EDIT = 'project/assets/EDIT'

// Utility Functions
export function getNewAssetID() {
    const id = parseInt(settingsManager.settings.numAssets, 10) + 1
    settingsManager.setNumAssets(id)
    settingsManager.save()
    return id
}

// Given an asset bundle, finds and returns an object with "true" values for any of the
//  conflicting keys (head, emote, emoteLayer) within its layers,
//  plus an array of used emotes
export function getConflicts(assets, layers) {
    function handleLayer(field) {
        return layer => {
            if (field in layer)
                return true
        }
    }

    const emotes = []
    function findEmotes(layer) {
        if (layer.emote != null && !emotes.includes(layer.emote))
            emotes.push(layer.emote)
    }
    Puppet.handleLayer(assets, layers, findEmotes)
    return {
        head: !!Puppet.handleLayer(assets, layers, handleLayer('head')),
        emoteLayer: !!Puppet.handleLayer(assets, layers, handleLayer('emoteLayer')),
        emotes
    }
}

// Action Creators
export function setAssets(assets) {
    return (dispatch, getState) => {
        let folders = Object.values(assets).reduce((acc, curr) => {
            if (acc.includes(curr.tab)) return acc
            return [...acc, curr.tab]
        }, [])
        dispatch(setFolders(folders))
        dispatch({ type: SET, assets })
    }
}

// Reducers
export default util.createReducer({}, {
    [SET]: (state, action) => action.assets,
    [ADD]: (state, action) => ({...state, ...action.assets}),
    [REMOVE]: (state, action) => {
        const assets = util.updateObject(state)
        action.ids.forEach(id => delete assets[id])
        return assets
    },
    [EDIT]: (state, action) => util.updateObject(state, {
        [action.id]: util.updateObject(state[action.id], action.asset)
    })
})
