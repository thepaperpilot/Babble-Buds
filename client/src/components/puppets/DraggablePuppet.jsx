import React, { Component } from 'react'
import { connect } from 'react-redux'
import { DragSource } from 'react-dnd'
import { ActionCreators as UndoActionCreators } from 'redux-undo'
import InlineEdit from './../ui/InlineEdit'
import SmallThumbnail from './../ui/SmallThumbnail'
import { ContextMenu, MenuItem, ContextMenuTrigger, SubMenu } from 'react-contextmenu'

class DraggablePuppet extends Component {
    constructor(props) {
        super(props)

        this.inlineEdit = React.createRef()

        this.edit = this.edit.bind(this)
        this.renamePuppet = this.renamePuppet.bind(this)
        this.editPuppet = this.editPuppet.bind(this)
        this.duplicatePuppet = this.duplicatePuppet.bind(this)
        this.deletePuppet = this.deletePuppet.bind(this)
    }

    edit() {
        if (this.inlineEdit.current)
            this.inlineEdit.current.getWrappedInstance().edit()
    }

    renamePuppet(name) {
        this.props.dispatch({
            type: 'CHANGE_PUPPET',
            puppet: parseInt(this.props.puppet, 10),
            key: 'name',
            value: name
        })
    }

    editPuppet() {
        this.props.dispatch({
            type: 'EDIT_PUPPET',
            id: parseInt(this.props.puppet, 10),
            character: this.props.character
        })
        this.props.dispatch(UndoActionCreators.clearHistory())
    }

    duplicatePuppet() {
        this.props.dispatch({
            type: 'DUPLICATE_PUPPET',
            puppet: parseInt(this.props.puppet, 10)
        })
    }

    deletePuppet() {
        if (this.props.id === parseInt(this.props.puppet, 10)) {
            this.props.dispatch({
                type: 'ERROR',
                content: 'You can\'t delete your active puppet. Please switch puppets and try again.'
            })
        } else {
            this.props.dispatch({
                type: 'DELETE_PUPPET',
                puppet: parseInt(this.props.puppet, 10)
            })
        }
    }

    render() {
        return this.props.connectDragSource(
            <div className="fillParent">
                <ContextMenuTrigger id={`contextmenu-puppet-${this.props.puppet}`} holdToDisplay={-1}>
                    {this.props.small ?
                        <div>
                            <InlineEdit
                                ref={this.inlineEdit}
                                disabled={true}
                                target={this.props.puppet}
                                targetType="puppet"
                                label={this.props.character.name}
                                className="line-item smallThumbnail-wrapper"
                                onChange={this.renamePuppet}
                                onDoubleClick={this.editPuppet}>
                                <SmallThumbnail
                                    label={this.props.character.name}
                                    image={this.props.thumbnail}/>
                            </InlineEdit>
                        </div> :
                        <div>
                            <InlineEdit
                                ref={this.inlineEdit}
                                disabled={true}
                                target={this.props.puppet}
                                targetType="puppet"
                                label={this.props.character.name}
                                className="char"
                                onChange={this.renamePuppet}
                                onDoubleClick={this.editPuppet}>
                                <img
                                    alt={this.props.character.name}
                                    src={this.props.thumbnail} />
                            </InlineEdit>
                        </div>
                    }
                </ContextMenuTrigger>
                <ContextMenu id={`contextmenu-puppet-${this.props.puppet}`}>
                    <MenuItem onClick={this.duplicatePuppet}>Duplicate</MenuItem>
                    <MenuItem onClick={this.edit}>Rename</MenuItem>
                    <MenuItem onClick={this.deletePuppet}>Delete</MenuItem>
                </ContextMenu>
            </div>)
    }
}

function mapStateToProps(state, props) {
    return {
        character: state.project.characters[props.puppet],
        thumbnail: state.project.characterThumbnails[props.puppet],
        id: state.project.settings.actor.id
    }
}

const puppetSource = {
    beginDrag(props) {
        return { puppet: props.puppet }
    }
}

function collect(connect) {
    return {
        connectDragSource: connect.dragSource()
    }
}

export default connect(mapStateToProps, null, null, { withRef: true })(DragSource('puppet', puppetSource, collect)(DraggablePuppet))
