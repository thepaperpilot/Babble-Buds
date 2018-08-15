import React, {Component} from 'react'
import { connect } from 'react-redux'

const electron = window.require('electron')

class Clipboard extends Component {
    constructor(props) {
        super(props)

        this.cut = this.cut.bind(this)
        this.copy = this.copy.bind(this)
        this.paste = this.paste.bind(this)
        this.delete = this.delete.bind(this)
        this.keyDown = this.keyDown.bind(this)
    }

    componentDidMount() {
        window.addEventListener('keydown', this.keyDown)
    }

    componentWillUnmount() {
        window.removeEventListener('keydown', this.keyDown)
    }

    cut() {
        this.copy()
        this.delete()
    }

    copy() {
        /*
        const needsActor = this.props.targetType === 'actor'
        const actions = this.props.actions[this.props.frame].filter(action =>
            needsActor === ('id' in action || 'target' in action))
        electron.clipboard.writeText(JSON.stringify(actions))
        */
    }

    paste() {
        /*
        try {
            const actions = JSON.parse(electron.clipboard.readText())
            this.props.dispatch({
                type: 'ADD_ACTIONS',
                frame: this.props.frame,
                actions
            })
        } catch (e) {
            // ignored
        }
        */
    }

    delete() {
        /*
        this.props.dispatch({
            type: 'REMOVE_ACTIONS',
            frame: this.props.frame,
            actor: this.props.targetType === 'actor' ? this.props.target : null
        })
        */
    }

    keyDown(e) {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA'))
            return

        if (!e.ctrlKey && e.keyCode !== 46)
            return

        if (this.props.targetType !== 'frame' && this.props.targetType !== 'actor')
            return

        switch (e.keyCode) {
        case 88: this.cut(); break
        case 67: this.copy(); break
        case 86: this.paste(); break
        case 46: this.delete(); break
        }
    }

    render() {
        return null
    }
}

function mapStateToProps(state) {
    return {}
    /*
    return {
        targetType: state.inspector.targetType,
        target: state.inspector.target,
        frame: state.timeline.present.frame,
        actions: state.timeline.present.keyframes.actions
    }
    */
}

export default connect(mapStateToProps)(Clipboard)
