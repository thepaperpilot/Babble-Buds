import React, {Component} from 'react'
import { connect } from 'react-redux'
import classNames from 'classnames'
import { ContextMenu, MenuItem, ContextMenuTrigger, SubMenu } from 'react-contextmenu'

import { getNewAssetID } from './../../reducers/project/assets'

const join = require('path').join

// TODO make it so we can drag this layer into the assets panel to create asset bundles
class Layer extends Component {
    constructor(props) {
        super(props)

        this.onNodeClick = this.onNodeClick.bind(this)
        this.editLayer = this.editLayer.bind(this)
        this.createAsset = this.createAsset.bind(this)
    }

    onNodeClick() {
        this.props.dispatch({
            type: 'SELECT_LAYER',
            path: this.props.path
        })
    }

    editLayer(type) {
        return () => {
            this.props.dispatch({
                type,
                path: this.props.path
            })
        }
    }

    createAsset(tab) {
        return () => {
            this.props.dispatch({
                type: 'NEW_ASSET_BUNDLE',
                id: `${this.props.self}:${getNewAssetID()}`,
                name: this.props.name,
                path: this.props.path,
                tab,
                layers: { children: this.props.children },
                creator: this.props.self
            })
        }
    }

    render() {
        const {selected, asset, assetsPath} = this.props
        const {path, id, name, children, nodeEmote, inherit, tabs} = this.props
        
        // TODO menu item to "recenter layer", which will only work on a layer with children, and will move the parent layer's position
        // so that its at the center of where all its children are, and offset each child the opposite direction to compensate
        // Thus making scaling and rotating work in a more straightforward way
        const className = ['layer']
        if (JSON.stringify(selected) === JSON.stringify(path))
            className.push('selected')
        const key = children == null ? id : name
        const emote = nodeEmote != null && inherit.emote == null ?
            <div className={this.props.emote === nodeEmote ?
                'emote-layer visible' : 'emote-layer'} /> : null
        return <div>
            <ContextMenuTrigger id={`contextmenu-layer-${JSON.stringify(path)}`} holdToDisplay={-1}>
                <div key={key}
                    className={classNames(className)}
                    onClick={this.onNodeClick}>
                    {children == null ?
                        asset ?
                            <div>
                                <img src={join(assetsPath, asset.location)}
                                    alt={asset.name} />
                                {name}
                            </div> : null :
                        name ? <div>{name}</div> : <div>root</div>}
                    {emote}
                </div>
            </ContextMenuTrigger>
            <ContextMenu id={`contextmenu-layer-${JSON.stringify(path)}`}>
                <MenuItem onClick={this.editLayer('DELETE_LAYER')}>Delete Layer</MenuItem>
                <MenuItem onClick={this.editLayer('WRAP_LAYER')}>Wrap Layer</MenuItem>
                {id == null && <MenuItem onClick={this.editLayer('ADD_LAYER')}>Add Layer</MenuItem>}
                {id == null && <SubMenu title="Convert to prefab">
                    {tabs.map(tab =>
                        <MenuItem
                            onClick={this.createAsset(tab)}
                            key={tab}>
                            {tab}
                        </MenuItem>
                    )}
                </SubMenu>}
            </ContextMenu>
        </div>
    }
}

function mapStateToProps(state, props) {
    return {
        selected: state.editor.present.layer,
        asset: state.project.assets[props.id],
        emote: state.editor.present.emote,
        assetsPath: state.project.assetsPath,
        self: state.self
    }
}

export default connect(mapStateToProps)(Layer)
