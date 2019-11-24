import util from './util.js'
import { setActors } from './controller'
import { setEnvironment, setDefaultEnvironment } from './environment'
import { addActor, removeActor, moveRight } from './actors'

// Action Types

// Action Creators
export function setSinglePlayer(openingProject = false) {
    return (dispatch, getState) => {
        const state = getState()

        // First see if we're already controlling a character,
        //  in which case just remove all characters we're not controlling
        if (state.controller.actors.length > 0) {
            state.actors.filter(actor => !state.controller.actors.includes(actor.id))
                .forEach(actor => dispatch(removeActor(actor.id)))
        } else {
            // If we're not controlling any, just remove all of them
            state.actors.forEach(actor => dispatch(removeActor(actor.id)))

            // We're also probably loading a project
            // So set our puppet to the first on our hotbar
            //  (and even if we're not, we should still add in at least one puppet to control)
            const hotbar = state.project.settings.hotbar
            let puppetId = hotbar.find(i => i in state.project.characters)
            
            // Unless our hotbar is somehow completely empty/invalid
            if (puppetId == null) {
                // Try finding the first character we have
                puppetId = Object.keys(state.project.characters)[0]
            }

            if (puppetId != null) {
                dispatch(addActor(0, puppetId, state.project.characters[puppetId]))
                dispatch(setActors([0]))
                setTimeout(() => dispatch(moveRight(0)), 1000)
            }
        }

        // First see if we're already using one of our environments
        if (state.environment.setter !== state.self || openingProject) {
            // Then see if we have an environment on our hotbar
            const hotbar = state.project.settings.environmentHotbar
            let envId = hotbar.find(i => i in state.project.environments)

            if (envId == null) {
                dispatch(setDefaultEnvironment())
            } else {
                dispatch(setEnvironment(state.self, envId, state.project.environments[envId]))
            }
        }
    }
}

// Reducers
export default util.createReducer(null, {})
