import React, { Component } from 'react'
import { connect } from 'react-redux'
import { DragSource, DragPreviewImage } from 'react-dnd'
import InlineEdit from '../ui/InlineEdit'
import EnvironmentDragPreview from './EnvironmentDragPreview'
import { ContextMenuTrigger } from 'react-contextmenu'
import { changeEnvironment } from '../../redux/project/environments/actions'
import { open } from '../../redux/editor/editor'

class Environment extends Component {
    constructor(props) {
        super(props)

        this.inlineEdit = React.createRef()

        this.renameEnvironment = this.renameEnvironment.bind(this)
        this.editEnvironment = this.editEnvironment.bind(this)
    }

    renameEnvironment(name) {
        this.props.dispatch(changeEnvironment(this.props.id, { name }))
    }

    editEnvironment() {
        if (this.props.id !== -1) {
            this.props.dispatch(open(this.props.id, this.props.environment.layers, 'environment'))
        }
    }

    render() {
        const {name, color, width, height} = this.props.environment
        
        const style = {
            backgroundColor: color
        }

        const ratio = (this.props.width - 4) / (this.props.height - 20)
        if (width / height > ratio) {
            style.width = '100%'
            const desiredHeight = (this.props.width - 4) * height / width
            const remainingHeight = this.props.height - 20 - desiredHeight
            style.margin = `${50 * remainingHeight / (this.props.width - 4)}% 0`
        } else {
            style.height = 'calc(100% - 16px)'
            style.width = 'auto'
            const desiredWidth = (this.props.height - 20) * width / height
            const remainingWidth = this.props.width - 4 - desiredWidth
            style.margin = `0 ${50 * remainingWidth / (this.props.width - 4)}%`
        }

        // Create drag preview image with an empty image,
        // so we can make our own dragpreview we have more control over
        const img = new Image()
        this.props.connectDragPreview(img)

        return <ContextMenuTrigger
            id={`contextmenu-environment-${this.props.contextmenu}`}
            holdToDisplay={-1}
            collect={() => ({
                environment: this.props.id,
                inlineEdit: this.inlineEdit,
                disabled: this.props.id === -1
            })}>
            {this.props.isDragging && <EnvironmentDragPreview
                thumbnail={this.props.thumbnail}
                name={name}
                monitor={this.props.monitor} />}
            {this.props.connectDragSource(this.props.small ?
                <div>
                    <InlineEdit
                        ref={this.inlineEdit}
                        disabled={this.props.id === -1}
                        target={this.props.id}
                        targetType="environment"
                        label={name}
                        className="line-item smallThumbnail-wrapper"
                        onChange={this.renameEnvironment}
                        onDoubleClick={this.editEnvironment}>
                        <div className="smallThumbnail-img" style={{width: '20px', height: '20px'}}>
                            <img
                                style={style}
                                alt={name}
                                src={this.props.thumbnail}
                                draggable={false} />
                        </div>
                    </InlineEdit>
                </div> :
                <div>
                    <InlineEdit
                        ref={this.inlineEdit}
                        disabled={this.props.id === -1}
                        target={this.props.id}
                        targetType="environment"
                        label={name}
                        className="char"
                        width={this.props.width}
                        height={this.props.height}
                        onChange={this.renameEnvironment}
                        onDoubleClick={this.editEnvironment}>
                        <img
                            style={style}
                            alt={name}
                            src={this.props.thumbnail}
                            draggable={false} />
                    </InlineEdit>
                </div>
            )}
        </ContextMenuTrigger>
    }
}

function mapStateToProps(state, props) {
    return {
        thumbnail: state.project.characterThumbnails[props.id]
    }
}

const environmentSource = {
    beginDrag(props) {
        return { environment: props.id }
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

export default connect(mapStateToProps)(DragSource('environment', environmentSource, collect)(Environment))
