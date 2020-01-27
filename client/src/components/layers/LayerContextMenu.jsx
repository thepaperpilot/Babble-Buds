import React, { Component } from 'react'
import { connect } from 'react-redux'
import { ContextMenu, MenuItem, SubMenu, connectMenu } from 'react-contextmenu'
import { deleteLayer, deleteEmitter, wrapLayer, addLayer } from '../../redux/editor/layers'
import { open } from '../../redux/editor/editor'
import { createAssetBundle } from '../../redux/project/assets/actions'

class LayerContextMenu extends Component {
    constructor(props) {
        super(props)

        this.editLayer = this.editLayer.bind(this)
        this.editBundle = this.editBundle.bind(this)
        this.createAsset = this.createAsset.bind(this)
    }

    editLayer(action) {
        return () => {
            this.props.dispatch(action(this.props.trigger.path))
        }
    }

    editBundle() {
        const {assetId, asset} = this.props.trigger
        
        this.props.dispatch(open(assetId, asset.layers, 'asset'))
    }

    createAsset(tab) {
        return () => {
            const { path, name } = this.props.trigger
            this.props.dispatch(createAssetBundle(path, name, tab))
        }
    }

    render() {
        if (!this.props.trigger) return <ContextMenu id={this.props.id}
            onShow={this.props.onShow} onHide={this.props.onHide}>
            <MenuItem onClick={this.editLayer(deleteLayer)}>Delete Layer</MenuItem>
            <MenuItem onClick={this.editLayer(wrapLayer)}>Wrap Layer</MenuItem>
        </ContextMenu>

        if (this.props.trigger.emitter) return <ContextMenu id={this.props.id}
            onShow={this.props.onShow} onHide={this.props.onHide}>
            <MenuItem onClick={this.editLayer(deleteEmitter)}>Delete Layer</MenuItem>
        </ContextMenu>

        const {assetId, tabs, asset} = this.props.trigger
        return <ContextMenu
            id={this.props.id} onShow={this.props.onShow} onHide={this.props.onHide}>
            <MenuItem onClick={this.editLayer(wrapLayer)}>Wrap Layer</MenuItem>
            {assetId && asset.type === 'bundle' &&
                <MenuItem onClick={this.editBundle}>Edit Bundle</MenuItem>}
            {assetId == null &&
                <MenuItem onClick={this.editLayer(addLayer)}>Add Layer</MenuItem>}
            {assetId == null && <SubMenu title="Convert to prefab">
                {tabs.map(tab =>
                    <MenuItem
                        onClick={this.createAsset(tab)}
                        key={tab}>
                        {tab}
                    </MenuItem>
                )}
            </SubMenu>}
            <MenuItem onClick={this.editLayer(deleteLayer)}>Delete Layer</MenuItem>
        </ContextMenu>
    }
}

export default id => connect()(connectMenu(`contextmenu-layer-${id}`)(LayerContextMenu))
