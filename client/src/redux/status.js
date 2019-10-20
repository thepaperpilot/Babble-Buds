import util from './util.js'

// Action Types
const ADD = 'status/ADD'
const UPDATE = 'status/UPDATE'

// Action Creators
export function info(message) {
    return {
        type: ADD,
        status: { message, type: 'info' }
    }
}

export function log(message) {
    return {
        type: ADD,
        status: { message, type: 'log' }
    }
}

export function warn(message) {
    return {
        type: ADD,
        status: { message, type: 'warn' }
    }
}

export function error(message, error) {
    return {
        type: ADD,
        status: { message, error, type: 'error' }
    }
}

export function inProgress(id, count, message = null) {
    return (dispatch, getState) => {
        const statuses = getState().status
        let status = statuses.find(log => log.id === id)

        if (status == null) {
            status = {
                id,
                type: 'log',
                content: message,
                message: `${message} (0/${count})`,
                total: count,
                count: 0
            }
            dispatch({ type: ADD, status })
        } else {
            status = { count, message: `${status.content} (${count}/${status.total})` }
            dispatch({ type: UPDATE, id, status })
        }
    }
}

export function inProgressIncrement(id, amount = 1) {
    return (dispatch, getState) => {
        const statuses = getState().status
        let status = statuses.find(log => log.id === id)

        if (status == null) {
            dispatch(warn("Attempted to increment a log message that doesn't exist"))
        } else if (status.total == null) {
            dispatch(warn("Attempted to increment a non-incrementable log message"))
        } else {
            const message = `${status.content} (${status.count + amount}/${status.total})`
            status = { count: status.count + amount, message }
            dispatch({ type: UPDATE, id, status })
        }
    }
}

// Reducers
export default util.createReducer([], {
    [ADD]: (state, action) => [...state, action.status],
    [UPDATE]: (state, action) => {
        const statuses = state.slice()
        const index = state.findIndex(status => status.id === action.id)
        statuses[index] = util.updateObject(statuses[index], action.status)
        return statuses
    }
})
