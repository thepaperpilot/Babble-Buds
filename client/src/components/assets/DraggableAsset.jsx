import React, { Component } from 'react'
import { connect } from 'react-redux'
import { DragSource } from 'react-dnd'
import cx from 'classnames'
import { ContextMenuTrigger } from 'react-contextmenu'
import InlineEdit from '../ui/InlineEdit'
import AssetDragPreview from './AssetDragPreview'
import { renameAsset } from '../../redux/project/assets/actions'
import { open } from '../../redux/editor/editor'

const path = window.require('path')

class DraggableAsset extends Component {
    constructor(props) {
        super(props)

        this.inlineEdit = React.createRef()

        this.renameAsset = this.renameAsset.bind(this)
        this.editAsset = this.editAsset.bind(this)
    }

    renameAsset(name) {
        this.props.dispatch(renameAsset(this.props.id, name))
    }

    editAsset() {
        if (this.props.asset.type === 'bundle') {
            this.props.dispatch(open(this.props.id, this.props.asset.layers, 'asset'))
        } else if (this.props.asset.type === 'particles') {
            this.props.dispatch(open(this.props.id, this.props.asset.emitters, 'particles'))
        }
    }

    render() {
        const disabled = this.props.id.split(':')[0] !== this.props.self
        const thumbnail = `${path.join(this.props.assetsPath, this.props.asset.thumbnail ?
            this.props.asset.thumbnail :
            this.props.asset.location)}?version=${this.props.asset.version}`
        const className = cx({
            char: !this.props.small,
            'line-item': this.props.small,
            'smallThumbnail-wrapper': this.props.small,
            animated: this.props.asset.type === 'animated',
            bundle: this.props.asset.type === 'bundle'
        })

        // Create drag preview image with an empty image,
        // so we can make our own dragpreview we have more control over
        const img = new Image()
        this.props.connectDragPreview(img)

        return <ContextMenuTrigger
            id={`contextmenu-asset-${this.props.contextmenu}`}
            holdToDisplay={-1}
            collect={() => ({ asset: this.props.id, inlineEdit: this.inlineEdit, disabled })}>
            {this.props.isDragging && <AssetDragPreview
                thumbnail={thumbnail}
                name={this.props.asset.name}
                monitor={this.props.monitor} />}
            {this.props.connectDragSource(this.props.small ?
                <div>
                    <InlineEdit
                        ref={this.inlineEdit}
                        disabled={disabled}
                        target={this.props.asset.name}
                        targetType="asset"
                        className={className}
                        onChange={this.renameAsset}
                        onDoubleClick={this.editAsset}>
                        <div className="smallThumbnail-img" style={{width: '20px', height: '20px'}}>
                            <img
                                alt={this.props.asset.name}
                                src={thumbnail}
                                draggable={false} />
                        </div>
                    </InlineEdit>
                </div> :
                <div>
                    <InlineEdit
                        ref={this.inlineEdit}
                        disabled={disabled}
                        target={this.props.asset.name}
                        targetType="asset"
                        className={className}
                        onChange={this.renameAsset}
                        onDoubleClick={this.editAsset}>
                        <img
                            alt={this.props.asset.name}
                            src={thumbnail}
                            draggable={false} />
                    </InlineEdit>
                </div>
            )}
        </ContextMenuTrigger>
    }
}

function mapStateToProps(state) {
    return {
        assetsPath: state.project.assetsPath,
        self: state.self
    }
}

const assetSource = {
    beginDrag: ({ id, asset, self }) => ({ id, asset, isOwned: id.split(':')[0] === self })
}

function collect(connect, monitor) {
    return {
        connectDragSource: connect.dragSource(),
        connectDragPreview: connect.dragPreview(),
        isDragging: monitor.isDragging(),
        monitor
    }
}

export default connect(mapStateToProps)(DragSource('asset', assetSource, collect)(DraggableAsset))
