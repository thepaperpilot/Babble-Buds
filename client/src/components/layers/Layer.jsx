import React, {Component} from 'react'
import { connect } from 'react-redux'
import classNames from 'classnames'
import { DropTarget } from 'react-dnd'
import { ContextMenuTrigger } from 'react-contextmenu'
import { ActionCreators as UndoActionCreators } from 'redux-undo'

const join = require('path').join

// TODO make it so we can drag this layer into the assets panel to create asset bundles
class Layer extends Component {
    constructor(props) {
        super(props)

        this.onNodeClick = this.onNodeClick.bind(this)
        this.editBundle = this.editBundle.bind(this)
    }

    onNodeClick() {
        this.props.dispatch({
            type: 'SELECT_LAYER',
            path: this.props.path
        })
    }

    editBundle() {
        if (this.props.asset && this.props.asset.type === 'bundle') {
            this.props.dispatch({
                type: 'EDIT_PUPPET',
                id: this.props.id,
                character: this.props.asset,
                objectType: 'asset'
            })
        }
    }

    render() {
        const {selected, asset, assetsPath, characterId, isOver, canDrop} = this.props
        const {path, id, name, children, nodeEmote, emotes, head, emoteLayer, inherit, tabs, self} = this.props
        
        // TODO menu item to "recenter layer", which will only work on a layer with children, and will move the parent layer's position
        // so that its at the center of where all its children are, and offset each child the opposite direction to compensate
        // Thus making scaling and rotating work in a more straightforward way
        const className = ['layer']
        if (JSON.stringify(selected) === JSON.stringify(path))
            className.push('selected')
        if ((inherit && 'emote' in inherit && nodeEmote != null) ||
            (nodeEmote != null && nodeEmote in emotes && JSON.stringify(emotes[nodeEmote].path) !== JSON.stringify(path)) ||
            (head != null && inherit && inherit.head != null) ||
            (emoteLayer != null && inherit && inherit.emoteLayer != null) ||
            (asset && asset.type === 'bundle' && id === characterId))
            className.push('warning')
        const emote = nodeEmote != null ?
            <div className={this.props.emote === nodeEmote ?
                'emote-layer visible' : 'emote-layer'} /> : null
        const bundle = asset && asset.type === 'bundle' ?
            <div className="asset-bundle" /> : null
        return <ContextMenuTrigger
            id={`contextmenu-layer-${this.props.contextmenu}`}
            holdToDisplay={-1}
            collect={() => ({ path, self, name, layerChildren: children, tabs, assetId: id, asset })}>
            {this.props.connectDropTarget(<div className={classNames(className)}
                onClick={this.onNodeClick}
                onDoubleClick={this.editBundle}
                style={{
                    // Set background color based on the current drop status
                    backgroundColor: isOver && canDrop ? 'rgba(0, 255, 0, .2)' :
                        canDrop ? 'rgba(0, 255, 0, .05)' : ''
                }}>
                {children == null ?
                    asset ?
                        <div>
                            <img src={join(assetsPath, `${asset.location}?version=${asset.version}`)}
                                alt={asset.name} />
                            {name}
                        </div> : null :
                    name ? <div>{name}</div> : <div>root</div>}
                {emote}
                {bundle}
            </div>)}
        </ContextMenuTrigger>
    }
}

const assetTarget = {
    drop: (item, monitor) => {
        const path = item.id ? item.path.slice(0, -1) : item.path
        const {id, asset} = monitor.getItem()

        item.dispatch({
            type: 'ADD_LAYER',
            path,
            layer: {
                id,
                name: asset.name,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
                x: 0,
                y: 0
            }
        })
        
        item.dispatch({
            type: 'SELECT_LAYER',
            path: [...path, item.id ? item.path.slice(-1)[0] : item.children.length]
        })
    }
}

function collect(connect, monitor) {
    return {
        connectDropTarget: connect.dropTarget(),
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop()
    }
}

function mapStateToProps(state, props) {
    return {
        characterId: state.editor.present.id,
        selected: state.editor.present.layer,
        asset: state.project.assets[props.id],
        emote: state.editor.present.emote,
        assetsPath: state.project.assetsPath,
        self: state.self
    }
}

export default connect(mapStateToProps)(DropTarget('asset', assetTarget, collect)(Layer))
