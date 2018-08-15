// TODO move to redux!

const updateCallbacks = []

exports.logs = []

exports.addListener = function(cb) {
    updateCallbacks.push(cb)
}

exports.removeListener = function(cb) {
    updateCallbacks.slice(updateCallbacks.indexOf(cb))
}

exports.info = function(string) {
    exports.log(string, 0)
}

// Types:
// 0 - Nothing
// 1 - Normal
// 2 - Reactions (Like saving puppets)
// 3 - Counters
// 5 - WARN
// 10 - ERR
exports.log = function(string, type = 1) {
    exports.logs.push({
        string, type
    })
    updateCallbacks.forEach(cb => cb(exports.logs))
    console[type >= 5 ? 'error' : 'log'](string)
}

exports.error = function(string, error) {
    exports.log(string, 10)
    console.error(error)
}

exports.addCounter = function(string, initialValue = 0) {
    exports.logs.push({
        string,
        type: 3,
        value: initialValue
    })
    updateCallbacks.forEach(cb => cb(exports.logs))
    return exports.logs.length - 1
}

exports.increment = function(index) {
    if (!exports.logs[index] || exports.logs[index].value == null) return
    exports.logs[index].value++
    //exports.log(string.replace('%x', counts[string]).replace('%s', counts[string] === 1 ? '' : 's'), 3, 3)
    updateCallbacks.forEach(cb => cb(exports.logs))
    return exports.logs[index].value === 0
}

exports.decrement = function(index) {
    if (!exports.logs[index] || exports.logs[index].value == null) return
    exports.logs[index].value--
    updateCallbacks.forEach(cb => cb(exports.logs))
    return exports.logs[index].value === 0
}

exports.getCount = function(index) {
    return exports.logs[index] && exports.logs[index].value
}
