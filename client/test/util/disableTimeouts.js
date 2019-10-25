function disableTimeouts() {
    this.setTimeout = setTimeout
    global.setTimeout = f => f()
}

const state = {}
const boundFunction = disableTimeouts.bind(state)

boundFunction.stop = function() {
    global.setTimeout = this.setTimeout
}.bind(state)

export default boundFunction
