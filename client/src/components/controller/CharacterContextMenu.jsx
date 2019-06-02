import React, {Component} from 'react'
import { connect } from 'react-redux'
import { ActionCreators as UndoActionCreators } from 'redux-undo'
import { ContextMenu, MenuItem, connectMenu } from 'react-contextmenu'

const MENU_TYPE = 'contextmenu-character'

class CharacterContextMenu extends Component {
    constructor(props) {
        super(props)

        this.clear = this.clear.bind(this)
        this.edit = this.edit.bind(this)
    }

    clear() {
        if (this.props.actor === this.props.trigger.puppet) {
            this.props.dispatch({
                type: 'ERROR',
                content: 'Can\'t clear active hotbar slot. Please switch to a different slot and try again.'
            })
        } else {
            this.props.dispatch({
                type: 'SET_HOTBAR_SLOT',
                index: this.props.trigger.index,
                puppet: 0
            })
        }
    }

    edit() {
        this.props.dispatch({
            type: 'EDIT_PUPPET',
            id: this.props.trigger.puppet,
            character: this.props.trigger.character
        })
        this.props.dispatch(UndoActionCreators.clearHistory())
    }

    render() {
        return <ContextMenu id={MENU_TYPE}>
            <MenuItem onClick={this.clear}>Clear Slot</MenuItem>
            <MenuItem onClick={this.edit}>Edit Puppet</MenuItem>
        </ContextMenu>
    }
}

function mapStateToProps(state) {
    return {
        actor: state.project.settings.actor.id
    }
}

export default connect(mapStateToProps)(connectMenu(MENU_TYPE)(CharacterContextMenu))
