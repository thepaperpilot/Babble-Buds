import React, { Component } from 'react'
import { connect } from 'react-redux'
import { ContextMenu, MenuItem, SubMenu, connectMenu } from 'react-contextmenu'

const MENU_TYPE = 'contextmenu-puppet'

class DraggablePuppet extends Component {
    constructor(props) {
        super(props)

        this.edit = this.edit.bind(this)
        this.duplicatePuppet = this.duplicatePuppet.bind(this)
        this.deletePuppet = this.deletePuppet.bind(this)
    }

    edit() {
        if (this.props.trigger.inlineEdit.current)
            this.props.trigger.inlineEdit.current.getWrappedInstance().edit()
    }

    duplicatePuppet() {
        this.props.dispatch({
            type: 'DUPLICATE_PUPPET',
            puppet: this.props.trigger.puppet
        })
    }

    deletePuppet() {
        if (this.props.id === this.props.trigger.puppet) {
            this.props.dispatch({
                type: 'ERROR',
                content: 'You can\'t delete your active puppet. Please switch puppets and try again.'
            })
        } else {
            this.props.dispatch({
                type: 'DELETE_PUPPET',
                puppet: this.props.trigger.puppet
            })
        }
    }

    shouldComponentUpdate() {
        return false
    }

    render() {
        return <ContextMenu id={MENU_TYPE}>
            <MenuItem onClick={this.duplicatePuppet}>Duplicate</MenuItem>
            <MenuItem onClick={this.edit}>Rename</MenuItem>
            <MenuItem onClick={this.deletePuppet}>Delete</MenuItem>
        </ContextMenu>
    }
}

function mapStateToProps(state) {
    return {
        id: state.project.settings.actor.id
    }
}

export default connect(mapStateToProps)(connectMenu(MENU_TYPE)(DraggablePuppet))
