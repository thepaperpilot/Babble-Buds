const util = require('./../util')

function setEmoteSelf(state, action) {
    const actor = util.updateObject(state.settings.actor, { emote: action.emote })
    const settings = util.updateObject(state.settings, { actor })
    return util.updateObject(state, { settings })
}

function moveLeftSelf(state) {
    let actor = state.settings.actor
    if (actor.facingLeft || actor.position === 0 || actor.position == state.settings.numCharacters + 1) {
        actor = util.updateObject(actor, { position: actor.position - 1, facingLeft: true })
    } else {
        actor = util.updateObject(actor, { facingLeft: true })
    }
    const settings = util.updateObject(state.settings, { actor })
    return util.updateObject(state, { settings })
}

function moveRightSelf(state) {
    let actor = state.settings.actor
    if (!actor.facingLeft || actor.position === 0 || actor.position == state.settings.numCharacters + 1) {
        actor = util.updateObject(actor, { position: actor.position + 1, facingLeft: false })
    } else {
        actor = util.updateObject(actor, { facingLeft: false })
    }
    const settings = util.updateObject(state.settings, { actor })
    return util.updateObject(state, { settings })
}

function jiggleSelf(state, action) {
    return state
}

function changePuppet(state, action) {
    if (state.settings.hotbar[action.index] === 0)
        return state
    const id = state.settings.hotbar[action.index]
    const actor = util.updateObject(state.settings.actor, { id })
    const settings = util.updateObject(state.settings, { actor })
    return util.updateObject(util.updateObject(state, { settings }))
}

function setHotbarSlot(state, action) {
    const hotbar = state.settings.hotbar.slice()
    const actor = util.updateObject(state.settings.actor)
    if (hotbar[action.index] === state.settings.actor.id) {
        actor.id = action.puppet
    }
    hotbar[action.index] = action.puppet
    const settings = util.updateObject(state.settings, { hotbar, actor })
    return util.updateObject(state, { settings })
}

export default {
    'SET_EMOTE_SELF': setEmoteSelf,
    'MOVE_LEFT_SELF': moveLeftSelf,
    'MOVE_RIGHT_SELF': moveRightSelf,
    'JIGGLE_SELF': jiggleSelf,
    'CHANGE_PUPPET_SELF': changePuppet,
    'SET_HOTBAR_SLOT': setHotbarSlot
}
