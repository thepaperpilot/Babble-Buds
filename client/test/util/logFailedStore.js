export default function(getState) {
    return function() {
        if (this.currentTest.state === 'failed') {
            console.log(getState())
        }
    }
}
