import React, { Component } from 'react'
import { connect } from 'react-redux'
import { ContextMenu, MenuItem, connectMenu } from 'react-contextmenu'
import { deleteCharacter, duplicateCharacter } from '../../redux/project/characters/actions'
import { changePuppet } from '../../redux/controller'

class PuppetContextMenu extends Component {
    constructor(props) {
        super(props)

        this.edit = this.edit.bind(this)
        this.duplicatePuppet = this.duplicatePuppet.bind(this)
        this.deletePuppet = this.deletePuppet.bind(this)
        this.switchPuppet = this.switchPuppet.bind(this)
    }

    edit() {
        if (this.props.trigger.inlineEdit.current)
            this.props.trigger.inlineEdit.current.edit()
    }

    duplicatePuppet() {
        this.props.dispatch(duplicateCharacter(this.props.trigger.puppet))
    }

    deletePuppet() {
        this.props.dispatch(deleteCharacter(this.props.trigger.puppet))
    }

    switchPuppet() {
        this.props.dispatch(changePuppet(this.props.trigger.puppet, true))
    }

    render() {
        return <ContextMenu id={this.props.id}
            onShow={this.props.onShow} onHide={this.props.onHide}>
            <MenuItem onClick={this.switchPuppet}>Switch to Puppet</MenuItem>
            <MenuItem onClick={this.duplicatePuppet}>Duplicate</MenuItem>
            {this.props.trigger && this.props.trigger.inlineEdit &&
                <MenuItem onClick={this.edit}>Rename</MenuItem>}
            <MenuItem onClick={this.deletePuppet}>Delete</MenuItem>
        </ContextMenu>
    }
}

export default id => connect()(connectMenu(`contextmenu-puppet-${id}`)(PuppetContextMenu))
