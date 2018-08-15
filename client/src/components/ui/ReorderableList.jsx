import React, {Component} from 'react'

class ReorderableList extends Component {
    constructor(props) {
        super(props)

        this.scheduleUpdate = this.scheduleUpdate.bind(this)
        this.update = this.update.bind(this)
    }

    componentWillUnmount() {
        if (this.requestedFrame !== null) {
            cancelAnimationFrame(this.requestedFrame)
        }
    }

    scheduleUpdate(update) {
        this.pendingUpdate = update

        if (!this.requestedFrame) {
            this.requestedFrame = requestAnimationFrame(this.update)
        }
    }

    update() {
        this.props.dispatch(this.pendingUpdate)
        this.pendingUpdate = null
        this.requestedFrame = null
    }

    render() {
        return null
    }
}

export default ReorderableList
