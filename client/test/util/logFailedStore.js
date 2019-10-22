export default function(store) {
    return function() {
        if (this.currentTest.state === 'failed') {
            console.log(store.getState())
        }
    }
}
