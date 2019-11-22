import React, { Component } from 'react'
import { connect } from 'react-redux'
import { DragSource, DragPreviewImage } from 'react-dnd'
import InlineEdit from '../ui/InlineEdit'
import PuppetDragPreview from './PuppetDragPreview'
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
        // Create drag preview image with an empty image,
        // so we can make our own dragpreview we have more control over
        const img = new Image()
        this.props.connectDragPreview(img)

        return <ContextMenuTrigger
            id={`contextmenu-puppet-${this.props.contextmenu}`}
            holdToDisplay={-1}
            collect={() => ({ puppet: parseInt(this.props.puppet, 10), inlineEdit: this.inlineEdit })}>
            {this.props.isDragging && <PuppetDragPreview
                thumbnail={this.props.thumbnail}
                name={this.props.name}
                monitor={this.props.monitor} />}
            {this.props.connectDragSource(this.props.small ?
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
                                src={this.props.thumbnail}
                                draggable={false} />
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
                            src={this.props.thumbnail}
                            draggable={false} />
                    </InlineEdit>
                </div>
            )}
        </ContextMenuTrigger>
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

function collect(connect, monitor) {
    return {
        connectDragSource: connect.dragSource(),
        connectDragPreview: connect.dragPreview(),
        isDragging: monitor.isDragging(),
        monitor
    }
}

export default connect(mapStateToProps)(DragSource('puppet', puppetSource, collect)(DraggablePuppet))
