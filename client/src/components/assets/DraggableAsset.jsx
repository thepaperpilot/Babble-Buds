import React, { Component } from 'react'
import { connect } from 'react-redux'
import { DragSource } from 'react-dnd'
import { ActionCreators as UndoActionCreators } from 'redux-undo'
import InlineEdit from './../ui/InlineEdit'
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
                character: this.props.asset
            })
            this.props.dispatch(UndoActionCreators.clearHistory())
        }
    }

    render() {
        // TODO When dragging, use image of asset, using current zoom
        const disabled = this.props.id.split(':')[0] !== this.props.self
        const thumbnail = path.join(this.props.assetsPath, this.props.asset.type === 'animated' ?
            this.props.asset.thumbnail :
            this.props.asset.location)
        return <div>
            <ContextMenuTrigger
                id="contextmenu-asset"
                holdToDisplay={-1}
                collect={({ asset, inlineEdit, disabled }) => ({ asset, inlineEdit, disabled })}
                asset={this.props.id}
                inlineEdit={this.inlineEdit}
                disabled={disabled} >
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
    beginDrag: ({ id, asset, self }) => ({ id, asset, isOwned: id.split(':')[0] === self })
}

function collect(connect) {
    return {
        connectDragSource: connect.dragSource()
    }
}

export default connect(mapStateToProps)(DragSource('asset', assetSource, collect)(DraggableAsset))
