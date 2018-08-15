const util = require('./../util')

export const DEFAULTS = []

function log(type) {
    return (state, action) => {
        return state.concat({
            message: action.content,
            type
        })
    }
}

function error(state, action) {
    return state.concat({
        message: action.content,
        error: action.error,
        type: 'error'
    })
}

// TODO have background become progress bar
function inProgress(state, action) {
    const logs = state.slice()
    let log = logs.findIndex(log => log.id === action.id)

    if (log === -1)
        logs.push({
            type: 'log',
            id: action.id,
            content: action.content,
            message: `${action.content} (0/${action.count})`,
            total: action.count,
            count: 0
        })
    else
        logs.splice(log, 1, util.updateObject(logs[log], {
            count: action.count,
            message: `${logs[log].content} (${action.count}/${logs[log].total})`
        }))

    return logs
}

export default util.createReducer(DEFAULTS, {
    'INFO': log('info'),
    'LOG': log('log'),
    'WARN': log('warn'),
    'ERROR': error,
    'IN_PROGRESS': inProgress
})
