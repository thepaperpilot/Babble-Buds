import React, {Component} from 'react'
import { connect } from 'react-redux'
import { ContextMenu, MenuItem, SubMenu, connectMenu } from 'react-contextmenu'
import { ActionCreators as UndoActionCreators } from 'redux-undo'

import { getNewAssetID } from './../../reducers/project/assets'

const MENU_TYPE = 'contextmenu-layer'

class LayerContextMenu extends Component {
    constructor(props) {
        super(props)

        this.editLayer = this.editLayer.bind(this)
        this.editBundle = this.editBundle.bind(this)
        this.createAsset = this.createAsset.bind(this)
    }

    editLayer(type) {
        return () => {
            this.props.dispatch({
                type,
                path: this.props.trigger.path
            })
        }
    }

    editBundle() {
        const {assetId, asset} = this.props.trigger
        
        this.props.dispatch({
            type: 'EDIT_PUPPET',
            id: assetId,
            character: asset,
            objectType: 'asset'
        })
    }

    createAsset(tab) {
        return () => {
            this.props.dispatch({
                type: 'NEW_ASSET_BUNDLE',
                id: `${this.props.trigger.self}:${getNewAssetID()}`,
                name: this.props.trigger.name,
                path: this.props.trigger.path,
                tab,
                layers: { children: this.props.trigger.layerChildren },
                creator: this.props.trigger.self
            })
        }
    }

    render() {
        if (!this.props.trigger) return <ContextMenu id={MENU_TYPE}>
            <MenuItem onClick={this.editLayer('DELETE_LAYER')}>Delete Layer</MenuItem>
            <MenuItem onClick={this.editLayer('WRAP_LAYER')}>Wrap Layer</MenuItem>
        </ContextMenu>

        const {assetId, tabs, asset} = this.props.trigger
        
        return <ContextMenu id={MENU_TYPE}>
            <MenuItem onClick={this.editLayer('DELETE_LAYER')}>Delete Layer</MenuItem>
            <MenuItem onClick={this.editLayer('WRAP_LAYER')}>Wrap Layer</MenuItem>
            {assetId && asset.type === 'bundle' && <MenuItem onClick={this.editBundle}>Edit Bundle</MenuItem>}
            {assetId == null && <MenuItem onClick={this.editLayer('ADD_LAYER')}>Add Layer</MenuItem>}
            {assetId == null && <SubMenu title="Convert to prefab">
                {tabs.map(tab =>
                    <MenuItem
                        onClick={this.createAsset(tab)}
                        key={tab}>
                        {tab}
                    </MenuItem>
                )}
            </SubMenu>}
        </ContextMenu>
    }
}

export default connect()(connectMenu(MENU_TYPE)(LayerContextMenu))
