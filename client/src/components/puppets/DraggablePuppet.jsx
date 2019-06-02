import React, { Component } from 'react'
import { connect } from 'react-redux'
import { DragSource } from 'react-dnd'
import { ActionCreators as UndoActionCreators } from 'redux-undo'
import InlineEdit from './../ui/InlineEdit'
import SmallThumbnail from './../ui/SmallThumbnail'
import { ContextMenuTrigger } from 'react-contextmenu'

class DraggablePuppet extends Component {
    constructor(props) {
        super(props)

        this.inlineEdit = React.createRef()

        this.renamePuppet = this.renamePuppet.bind(this)
        this.editPuppet = this.editPuppet.bind(this)
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

    render() {
        return this.props.connectDragSource(
            <div className="fillParent">
                <ContextMenuTrigger
                    id="contextmenu-puppet"
                    holdToDisplay={-1}
                    collect={() => ({ puppet: parseInt(this.props.puppet, 10), inlineEdit: this.inlineEdit })}>
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
            </div>)
    }
}

function mapStateToProps(state, props) {
    return {
        character: state.project.characters[props.puppet],
        thumbnail: state.project.characterThumbnails[props.puppet]
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

export default connect(mapStateToProps)(DragSource('puppet', puppetSource, collect)(DraggablePuppet))
