import React, { Component } from 'react'
import { connect } from 'react-redux'
import { DragSource } from 'react-dnd'
import InlineEdit from './../ui/InlineEdit'
import { ContextMenu, MenuItem, ContextMenuTrigger, SubMenu } from 'react-contextmenu'

const path = window.require('path')

class DraggableAsset extends Component {
    constructor(props) {
        super(props)

        this.inlineEdit = React.createRef()

        this.edit = this.edit.bind(this)
        this.deleteAsset = this.deleteAsset.bind(this)
        this.renameAsset = this.renameAsset.bind(this)
        this.openAsset = this.openAsset.bind(this)
        this.editAsset = this.editAsset.bind(this)
        this.moveAsset = this.moveAsset.bind(this)
        this.duplicateAsset = this.duplicateAsset.bind(this)
    }

    edit() {
        if (this.inlineEdit.current)
            this.inlineEdit.current.getWrappedInstance().edit()
    }

    deleteAsset() {
        this.props.dispatch({
            type: 'DELETE_ASSET',
            asset: this.props.id
        })
    }

    renameAsset(name) {
        this.props.dispatch({
            type: 'RENAME_ASSET',
            asset: this.props.id,
            name
        })
    }

    openAsset() {
        this.props.dispatch({
            type: 'INSPECT',
            targetType: 'asset',
            target: this.props.id
        })
    }

    editAsset() {
        if (this.props.asset.type === 'bundle')
            this.props.dispatch({
                type: 'EDIT_PUPPET',
                id: this.props.id,
                character: this.props.asset
            })
    }

    moveAsset(tab) {
        return () => {
            this.props.dispatch({
                type: 'MOVE_ASSET',
                asset: this.props.id,
                tab
            })
        }
    }

    duplicateAsset() {
        this.props.dispatch({
            type: 'DUPLICATE_ASSET',
            asset: this.props.id
        })
    }

    render() {
        // TODO When dragging, use image of asset, using current zoom
        // TODO disable delete option when in multiplayer
        const disabled = this.props.id.split(':')[0] !== this.props.self
        const thumbnail = path.join(this.props.assetsPath, this.props.asset.type === 'animated' ?
            this.props.asset.thumbnail :
            this.props.asset.location)
        return <div>
            <ContextMenuTrigger id={`contextmenu-asset-${this.props.id}`} holdToDisplay={-1}>
                {this.props.connectDragSource(this.props.small ?
                    <div>
                        <InlineEdit
                            ref={this.inlineEdit}
                            disabled={true}
                            target={this.props.asset.name}
                            targetType="asset"
                            className="line-item smallThumbnail-wrapper"
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
                            disabled={true}
                            target={this.props.asset.name}
                            targetType="asset"
                            className="char"
                            onChange={this.renameAsset}
                            onDoubleClick={this.editAsset}>
                            <img
                                alt={this.props.asset.name}
                                src={thumbnail} />
                        </InlineEdit>
                    </div>
                )}
            </ContextMenuTrigger>
            <ContextMenu id={`contextmenu-asset-${this.props.id}`}>
                <MenuItem onClick={this.duplicateAsset}>Duplicate</MenuItem>
                {disabled || <div>
                    <SubMenu title="Move">
                        {this.props.tabs.map(tab =>
                            <MenuItem
                                onClick={this.moveAsset(tab)}
                                key={tab}>
                                {tab}
                            </MenuItem>
                        )}
                        <MenuItem divider />
                        <MenuItem onClick={this.props.newAssetTab}>New Folder</MenuItem>
                    </SubMenu>
                    <MenuItem onClick={this.edit}>Rename</MenuItem>
                </div>}
                {disabled || <MenuItem onClick={this.deleteAsset}>Delete</MenuItem>}
            </ContextMenu>
        </div>
    }
}

function mapStateToProps(state) {
    return {
        assetsPath: state.project.assetsPath,
        self: state.self
    }
}

const assetSource = {
    beginDrag(props) {
        return { asset: props.id }
    }
}

function collect(connect) {
    return {
        connectDragSource: connect.dragSource()
    }
}

export default connect(mapStateToProps)(DragSource('asset', assetSource, collect)(DraggableAsset))
