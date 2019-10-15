import React, { Component } from 'react'
import { connect } from 'react-redux'
import Shortcut from './Shortcut'
import { setShortcut } from '../../redux/project/settings/shortcuts'

class Shortcuts extends Component {
    constructor(props) {
        super(props)

        this.onChange = this.onChange.bind(this)
    }

    onChange(shortcut) {
        return value => this.props.dispatch(setShortcut(shortcut, value))
    }

    render() {
        return (
            <div>
                {Object.keys(this.props.shortcuts).map(key => <Shortcut
                    key={key}
                    title={key}
                    value={this.props.shortcuts[key]}
                    onChange={this.onChange(key)} />)}
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        shortcuts: state.project.settings.shortcuts
    }
}

export default connect(mapStateToProps)(Shortcuts)
