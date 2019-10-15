import React, { Component } from 'react'
import { connect } from 'react-redux'
import { DragSource, DragPreviewImage } from 'react-dnd'
import InlineEdit from '../ui/InlineEdit'
import { ContextMenuTrigger } from 'react-contextmenu'
import { changeCharacter } from '../../redux/project/characters/actions'
import { open } from '../../redux/editor/editor'

class DraggablePuppet extends Component {
    constructor(props) {
        super(props)

        this.inlineEdit = React.createRef()

        this.renamePuppet = this.renamePuppet.bind(this)
        this.editPuppet = this.editPuppet.bind(this)
    }

    renamePuppet(name) {
        this.props.dispatch(changeCharacter(parseInt(this.props.puppet, 10), { name }))
    }

    editPuppet() {
        this.props.dispatch(open(parseInt(this.props.puppet, 10), this.props.layers))
    }

    render() {
        return this.props.connectDragSource(
            <div>
                <ContextMenuTrigger
                    id={`contextmenu-puppet-${this.props.contextmenu}`}
                    holdToDisplay={-1}
                    collect={() => ({ puppet: parseInt(this.props.puppet, 10), inlineEdit: this.inlineEdit })}>
                    <DragPreviewImage src={this.props.thumbnail} connect={this.props.connectDragPreview} />
                    {this.props.small ?
                        <div>
                            <InlineEdit
                                ref={this.inlineEdit}
                                disabled={true}
                                target={this.props.puppet}
                                targetType="puppet"
                                label={this.props.name}
                                className="line-item smallThumbnail-wrapper"
                                onChange={this.renamePuppet}
                                onDoubleClick={this.editPuppet}>
                                <div className="smallThumbnail-img" style={{width: '20px', height: '20px'}}>
                                    <img
                                        alt={this.props.name}
                                        src={this.props.thumbnail}/>
                                </div>
                            </InlineEdit>
                        </div> :
                        <div>
                            <InlineEdit
                                ref={this.inlineEdit}
                                disabled={true}
                                target={this.props.puppet}
                                targetType="puppet"
                                label={this.props.name}
                                className="char"
                                height={this.props.height}
                                onChange={this.renamePuppet}
                                onDoubleClick={this.editPuppet}>
                                <img
                                    alt={this.props.name}
                                    src={this.props.thumbnail} />
                            </InlineEdit>
                        </div>
                    }
                </ContextMenuTrigger>
            </div>)
    }
}

function mapStateToProps(state, props) {
    const character = state.project.characters[props.puppet]
    return {
        name: character.name,
        layers: character.layers,
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
        connectDragSource: connect.dragSource(),
        connectDragPreview: connect.dragPreview()
    }
}

export default connect(mapStateToProps)(DragSource('puppet', puppetSource, collect)(DraggablePuppet))
