import React, { Component } from 'react'
import { connect } from 'react-redux'
import { ContextMenu, MenuItem, connectMenu } from 'react-contextmenu'

class PuppetContextMenu extends Component {
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
        if (this.props.selfId === this.props.trigger.puppet) {
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

    render() {
        return <ContextMenu id={this.props.id}
            onShow={this.props.onShow} onHide={this.props.onHide}>
            <MenuItem onClick={this.duplicatePuppet}>Duplicate</MenuItem>
            {this.props.trigger && this.props.trigger.inlineEdit &&
                <MenuItem onClick={this.edit}>Rename</MenuItem>}
            <MenuItem onClick={this.deletePuppet}>Delete</MenuItem>
        </ContextMenu>
    }
}

function mapStateToProps(state) {
    return {
        selfId: state.project.settings.actor.id
    }
}

export default id => connect(mapStateToProps)(connectMenu(`contextmenu-puppet-${id}`)(PuppetContextMenu))
