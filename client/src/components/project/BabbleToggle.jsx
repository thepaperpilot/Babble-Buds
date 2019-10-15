import { Component } from 'react'
import { connect } from 'react-redux'
import { setBabbling } from '../../redux/controller'

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
        this.props.dispatch(setBabbling(!this.props.babbling))
    }

    render() {
        return null
    }
}

function mapStateToProps(state) {
    return {
        babbling: state.controller.babbling
    }
}

export default connect(mapStateToProps)(BabbleToggle)
