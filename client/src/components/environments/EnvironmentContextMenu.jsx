import React, { Component } from 'react'
import { connect } from 'react-redux'
import { ContextMenu, MenuItem, connectMenu } from 'react-contextmenu'

class EnvironmentContextMenu extends Component {
    constructor(props) {
        super(props)

        this.edit = this.edit.bind(this)
        this.duplicateEnvironment = this.duplicateEnvironment.bind(this)
        this.deleteEnvironment = this.deleteEnvironment.bind(this)
    }

    edit() {
        if (this.props.trigger.inlineEdit.current)
            this.props.trigger.inlineEdit.current.getWrappedInstance().edit()
    }

    duplicateEnvironment() {
        this.props.dispatch({
            type: 'DUPLICATE_ENVIRONMENT',
            environment: this.props.trigger.environment
        })
    }

    deleteEnvironment() {
        this.props.dispatch({
            type: 'DELETE_ENVIRONMENT',
            environment: this.props.trigger.environment
        })
    }

    render() {
        return <ContextMenu id={this.props.id}
            onShow={this.props.onShow} onHide={this.props.onHide}>
            <MenuItem onClick={this.duplicateEnvironment}>Duplicate</MenuItem>
            {!this.props.trigger || this.props.trigger.disabled ? null : <React.Fragment>
                {this.props.trigger.inlineEdit &&
                    <MenuItem onClick={this.edit}>Rename</MenuItem>}
                <MenuItem onClick={this.deleteEnvironment}>Delete</MenuItem>
            </React.Fragment>}
        </ContextMenu>
    }
}

export default id => connect()(connectMenu(`contextmenu-environment-${id}`)(EnvironmentContextMenu))
