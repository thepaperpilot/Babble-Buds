import React, {Component} from 'react'
import { connect } from 'react-redux'
import { ContextMenu, MenuItem, connectMenu } from 'react-contextmenu'
import { open } from '../../redux/editor/editor'
import { setSlot } from '../../redux/project/settings/environmentHotbar'

class EnvironmentContextMenu extends Component {
    constructor(props) {
        super(props)

        this.clear = this.clear.bind(this)
        this.edit = this.edit.bind(this)
    }

    clear() {
        this.props.dispatch(setSlot(this.props.trigger.index, 0))
    }

    edit() {
        this.props.dispatch(open(this.props.trigger.env, this.props.trigger.environment.layers))
    }

    render() {
        return <ContextMenu id={this.props.id}>
            <MenuItem onClick={this.clear}>Clear Slot</MenuItem>
            <MenuItem onClick={this.edit}>Edit Character</MenuItem>
        </ContextMenu>
    }
}

export default id => connect()(connectMenu(`contextmenu-environment-${id}`)(EnvironmentContextMenu))
