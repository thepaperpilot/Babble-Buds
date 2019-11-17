import util from '../util.js'
import { log } from '../status'

// Action Types
const SET = 'project/characterThumbnails/SET'
const REMOVE = 'project/characterThumbnails/REMOVE'
const EDIT = 'project/characterThumbnails/EDIT'

// Action Creators
export function setThumbnails(thumbnails = {}) {
    return { type: SET, thumbnails }
}

export function removeThumbnail(id) {
    return { type: REMOVE, id }
}

export function updateThumbnail(id, type, thumbnailsPath) {
    return (dispatch, getState) => {
        const { assets, characters, environments } = getState().project
        
        let name
        switch (type) {
        case 'puppet':
            if (id in characters)
                name = characters[id].name
            else return
            break
        case 'environment':
            if (id in environments)
                name = environments[id].name
            else return
            break
        default:
            return
        }

        const path =
            `file:///${thumbnailsPath}.png?random=${new Date().getTime()}`.replace(/\\/g, '/')
        dispatch({ type: EDIT, id, thumbnailsPath: path })
        dispatch(log(`Update thumbnail for "${name}" ${type}.`))
    }
}

// Reducers
export default util.createReducer({}, {
    [SET]: (state, action) => action.thumbnails,
    [REMOVE]: (state, action) => {
        const thumbnails = util.updateObject(state)
        delete thumbnails[action.id]
        return thumbnails
    },
    [EDIT]: (state, action) => ({
        ...state,
        [action.id]: action.thumbnailsPath
    })
})
