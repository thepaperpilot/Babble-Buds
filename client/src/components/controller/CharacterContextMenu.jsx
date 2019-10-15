import React, {Component} from 'react'
import { connect } from 'react-redux'
import { ContextMenu, MenuItem, connectMenu } from 'react-contextmenu'
import { open } from '../../redux/editor/editor'
import { setSlot } from '../../redux/project/settings/hotbar'

class CharacterContextMenu extends Component {
    constructor(props) {
        super(props)

        this.clear = this.clear.bind(this)
        this.edit = this.edit.bind(this)
    }

    clear() {
        this.props.dispatch(setSlot(this.props.trigger.index, 0))
    }

    edit() {
        this.props.dispatch(open(this.props.trigger.puppet, this.props.trigger.character.layers))
    }

    render() {
        return <ContextMenu id={this.props.id}>
            <MenuItem onClick={this.clear}>Clear Slot</MenuItem>
            <MenuItem onClick={this.edit}>Edit Puppet</MenuItem>
        </ContextMenu>
    }
}

export default id => connect()(connectMenu(`contextmenu-character-${id}`)(CharacterContextMenu))
