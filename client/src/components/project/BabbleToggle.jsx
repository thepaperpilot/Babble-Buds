import {Component} from 'react'
import { connect } from 'react-redux'

const electron = window.require('electron')

class BabbleToggle extends Component {
    constructor(props) {
        super(props)

        this.babbleToggle = this.babbleToggle.bind(this)
    }

    componentDidMount() {
        electron.ipcRenderer.on('babbleToggle', this.babbleToggle)
    }

    componentWillUnmount() {
        electron.ipcRenderer.on('babbleToggle', this.babbleToggle)
    }

    babbleToggle() {
        this.props.dispatch({
            type: `${this.props.babbling ? 'STOP' : 'START'}_BABBLING_SELF`
        })
    }

    render() {
        return null
    }
}

function mapStateToProps(state) {
    return {
        babbling: state.babbling
    }
}

export default connect(mapStateToProps)(BabbleToggle)
