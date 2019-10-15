import util from '../util.js'

const fs = window.require('fs-extra')
const path = window.require('path')
const remote = window.require('electron').remote
const settingsManager = remote.require('./main-process/settings')

// Action Types
const SAVE = 'project/saver/SAVE'

// Utility Function
function saveCharacter(location, thumbnailsPath, id, character) {
    // Write character file
    fs.writeFile(location, JSON.stringify(character, null, 4))

    // Write main thumbnail
    if (fs.existsSync(path.join(thumbnailsPath, `new-${id}.png`)))
        fs.renameSync(path.join(thumbnailsPath, `new-${id}.png`), 
            path.join(thumbnailsPath, `${id}.png`))

    // Write emote thumbnails
    if (fs.existsSync(path.join(thumbnailsPath, `new-${id}`))) {
        if (fs.existsSync(path.join(thumbnailsPath, `${id}`)))
            fs.removeSync(path.join(thumbnailsPath, `${id}`))
        fs.renameSync(path.join(thumbnailsPath, `new-${id}`), 
            path.join(thumbnailsPath, `${id}`))
    }
}

// Action Creators
export function save() {
    return (dispatch, getState) => {
        const { settings, characters, environments, assets } = getState().project

        // Save project settings
        const project = settingsManager.settings.openProject
        fs.writeFile(project, JSON.stringify(settings, null, 4))

        // Save project characters and environments
        const thumbnailsPath = path.join(project, settings.charactersPath, '..', 'thumbnails')
        settings.characters.forEach(character =>
            saveCharacter(path.join(project, '..', 'characters', character.location),
                thumbnailsPath, character.id, characters[character.id])
        )
        settings.environments.forEach(environment => {
            saveCharacter(path.join(project, '..', 'characters', environment.location),
                thumbnailsPath, environment.id, environments[environment.id])
        })

        // Save project assets
        fs.writeFile(path.join(project, settings.assetsPath, 'assets.json'),
            JSON.stringify(assets))

        // TODO re-implement generating project thumbnails
        settingsManager.addRecentProject()
        settingsManager.save()

        dispatch({
            type: SAVE,
            settings: JSON.stringify(settings),
            characters: JSON.stringify(characters),
            environments: JSON.stringify(environments),
            assets: JSON.stringify(assets)
        })
    }
}

export function load(settings, characters, environments, assets) {
    return {
        type: SAVE,
        settings: JSON.stringify(settings),
        characters: JSON.stringify(characters),
        environments: JSON.stringify(environments),
        assets: JSON.stringify(assets)
    }
}

// Reducers
export default util.createReducer({
    settings: '',
    characters: '',
    environments: '',
    assets: ''
}, {
    [SAVE]: (state, action) => ({ 
        settings: action.settings,
        characters: action.characters,
        environments: action.environments,
        assets: action.assets
    })
})
