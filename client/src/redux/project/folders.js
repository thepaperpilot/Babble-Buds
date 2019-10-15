import util from '../util.js'
import { warn } from '../status'
import { moveAsset, deleteAssets } from './assets/actions'

// Action Types
const SET_FOLDERS = 'project/folders/SET_FOLDERS'
const ADD_FOLDER = 'project/folders/ADD_FOLDER'
const REMOVE_FOLDER = 'project/folders/REMOVE_FOLDER'
const MOVE_FOLDER = 'project/folders/MOVE_FOLDER'

// Action Creators
export function setFolders(folders) {
    return { type: SET_FOLDERS, folders }
}

export function addFolder(folder) {
    return { type: ADD_FOLDER, folder}
}

export function removeFolder(folder, deleteFolder = false) {
    if (!deleteFolder)
        return { type: REMOVE_FOLDER, folder }

    return (dispatch, getState) => {
        const assets = getState().project.assets

        // TODO can't delete other people's assets IF we're connected to other people
        dispatch(deleteAssets(Object.keys(assets).filter(id => assets[id].tab === folder)))
        dispatch({ type: REMOVE_FOLDER, folder })
    }
}

export function moveFolder(oldIndex, newIndex) {
    return { type: MOVE_FOLDER, oldIndex, newIndex }
}

export function renameFolder(old, newFolder) {
    return (dispatch, getState) => {
        const state = getState()
        const assets = state.project.assets
        const self = state.self

        let failed = false
        Object.keys(assets).filter(id => assets[id].tab === old).forEach(id => {
            if (id.split(':')[0] === self) {
                dispatch(moveAsset(id, newFolder))
            } else failed = true
        })

        if (failed)
            dispatch(warn("Unable to remove old folder because some assets inside it are owned by someone else. To delete that folder you'll have to remove those assets and try again."))
    }
}

// Reducers
export default util.createReducer([], {
    [SET_FOLDERS]: (state, action) => action.folders,
    [ADD_FOLDER]: (state, action) => [...state, action.folder],
    [REMOVE_FOLDER]: (state, action) => {
        const index = state.indexOf(action.folder)
        return [...state.slice(0, index), ...state.slice(index + 1)]
    },
    [MOVE_FOLDER]: (state, action) => {
        const folders = state.slice()
        const folder = folders.splice(action.oldIndex, 1)[0]
        return [...folders.slice(0, action.newIndex), folder, ...folders.slice(action.newIndex)]
    }
})
