let status
let currPriority
let counts

exports.init = function() {
    let remote = require('electron').remote
    status = document.getElementById('status')
    status.addEventListener('click', () => {
        remote.webContents.getFocusedWebContents().toggleDevTools()
    })
    currPriority = 0
    counts = {}
    exports.info(`Babble Buds version: ${remote.app.getVersion()}`)
    exports.info(`Other Versions: ${JSON.stringify(process.versions, null, 2)}`)
}

exports.info = function(string) {
    console.log(string)
}

// Priorities:
// 0 - Nothing
// 1 - Normal
// 2 - Reactions (Like saving puppets)
// 3 - Counters
// 5 - WARN
// 10 - ERR
exports.log = function(string, priority, tolerance) {
    status.innerText += (status.innerText === '' ? '' : '\n') + string
    if (priority >= currPriority) {
        currPriority = tolerance
        status.scrollTop = status.scrollHeight
    }
    console.log(string)
}

exports.error = function(string, error) {
    exports.log(string, 10, 2)
    console.error(error)
}

exports.increment = function(string) {
    if (!counts[string]) counts[string] = 0
    counts[string]++
    exports.log(string.replace('%x', counts[string]).replace('%s', counts[string] === 1 ? '' : 's'), 3, 3)
    return counts[string] === 0
}

exports.decrement = function(string) {
    if (!counts[string]) counts[string] = 0
    counts[string]--
    exports.log(string.replace('%x', counts[string]).replace('%s', counts[string] === 1 ? '' : 's'), 3, 3)
    return counts[string] === 0
}

exports.getCount = function(string) {
    return counts[string]
}
