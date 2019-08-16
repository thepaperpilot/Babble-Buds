import React, { Component } from 'react'
import { connect } from 'react-redux'
import { DragSource, DragPreviewImage } from 'react-dnd'
import { ActionCreators as UndoActionCreators } from 'redux-undo'
import InlineEdit from './../ui/InlineEdit'
import cx from 'classnames'
import { ContextMenuTrigger } from 'react-contextmenu'

const path = window.require('path')

class DraggableAsset extends Component {
    constructor(props) {
        super(props)

        this.inlineEdit = React.createRef()

        this.renameAsset = this.renameAsset.bind(this)
        this.editAsset = this.editAsset.bind(this)
    }

    renameAsset(name) {
        this.props.dispatch({
            type: 'RENAME_ASSET',
            asset: this.props.id,
            name
        })
    }

    editAsset() {
        if (this.props.asset.type === 'bundle') {
            this.props.dispatch({
                type: 'EDIT_PUPPET',
                id: this.props.id,
                character: this.props.asset,
                objectType: 'asset'
            })
        }
    }

    render() {
        const disabled = this.props.id.split(':')[0] !== this.props.self
        const thumbnail = `${path.join(this.props.assetsPath, this.props.asset.type === 'animated' ?
            this.props.asset.thumbnail :
            this.props.asset.location)}?version=${this.props.asset.version}`
        const className = cx({
            char: !this.props.small,
            'line-item': this.props.small,
            'smallThumbnail-wrapper': this.props.small,
            animated: this.props.asset.type === 'animated',
            bundle: this.props.asset.type === 'bundle'
        })
        return <ContextMenuTrigger
            id={`contextmenu-asset-${this.props.contextmenu}`}
            holdToDisplay={-1}
            collect={() => ({ asset: this.props.id, inlineEdit: this.inlineEdit, disabled })}>
            <DragPreviewImage src={thumbnail} connect={this.props.connectDragPreview} />
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
                                src={thumbnail}/>
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
                            src={thumbnail} />
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

function collect(connect) {
    return {
        connectDragSource: connect.dragSource(),
        connectDragPreview: connect.dragPreview()
    }
}

export default connect(mapStateToProps)(DragSource('asset', assetSource, collect)(DraggableAsset))
