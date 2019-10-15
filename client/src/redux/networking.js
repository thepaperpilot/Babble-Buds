import util from './util.js'
import { setActors } from './controller'
import { addActor, removeActor, moveRight } from './actors'

// Action Types

// Action Creators
export function setSinglePlayer() {
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

            // Otherwise, we're probably loading a project
            // So set our puppet to the first on our hotbar
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
    }
}

// Reducers
export default util.createReducer(null, {})
