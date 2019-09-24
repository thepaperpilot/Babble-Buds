import React, {Component} from 'react'
import { connect } from 'react-redux'
import classNames from 'classnames'
import { DropTarget } from 'react-dnd'
import { ContextMenuTrigger } from 'react-contextmenu'
import { ActionCreators as UndoActionCreators } from 'redux-undo'
import {Puppet} from 'babble.js'

const join = require('path').join

export function comparePaths(a, b) {
    if (!(a instanceof Array && b instanceof Array))
        return false
    if (a.length !== b.length)
        return false
    for (let i = 0; i < a.length; i++)
        if (a[i] !== b[i]) {
            return false
        }
    return true
}

const CHARACTER_PLACEHOLDER = {
    location: '',
    name: 'PUPPET_PLACEHOLDER',
    panning: [],
    tab: '',
    type: 'special',
    version: 1
}

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
            path: this.props.path,
            asset: this.props.asset
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
        const {selected, asset, assetsPath, isOver, canDrop} = this.props
        const {path, id, name, children, nodeEmote, emotes, head, emoteLayer, inherit, tabs, self} = this.props
        
        // TODO context menu item to "recenter layer", which will only work on a layer
        // with children, and will move the parent layer's position so that its at the
        // center of where all its children are, and offset each child the opposite
        // direction to compensate.
        // Thus making scaling and rotating work in a more straightforward way
        const className = ['layer']
        if (comparePaths(selected, path))
            className.push('selected')

        // Check for errors
        // We have an emote but a parent already has one
        if ((inherit && 'emote' in inherit && nodeEmote != null) ||
            // We have an emote but that emote already exists in this puppet
            (nodeEmote != null && nodeEmote in emotes && !comparePaths(emotes[nodeEmote], path)) ||
            // We have a head setting but a parent already has one
            (head != null && inherit && inherit.head != null) ||
            // We have a emote layer setting but a parent already has one
            (emoteLayer != null && inherit && inherit.emoteLayer != null) ||
            // At least one of many things has gone wrong relating to asset bundles
            (asset && asset.type === 'bundle' && (
                Object.keys(asset.conflicts).some(c => asset.conflicts[c] && c in inherit) ||
                asset.conflicts.emotes.some(e => e in emotes && !comparePaths(emotes[e], path)))))
            className.push('warning')

        const isBundle = asset && asset.type === 'bundle'

        const emote = nodeEmote != null ||
            (isBundle && asset.conflicts.emotes.length !== 0) ?
            <div className={this.props.emote === nodeEmote ||
                (isBundle && asset.conflicts.emotes.includes(this.props.emote)) ?
                'emote-layer visible' : 'emote-layer'} /> : null
        
        const bundle = isBundle ? <div className="asset-bundle" /> : null

        if (asset && asset.type === 'special')
            return <div
                className={classNames(className, 'special')}
                onClick={this.onNodeClick}>
                {name}
            </div>

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
                leaf: true,
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
        assets: state.project.assets,
        asset: props.id === 'CHARACTER_PLACEHOLDER' ?
            CHARACTER_PLACEHOLDER : state.project.assets[props.id],
        emote: state.editor.present.emote,
        assetsPath: state.project.assetsPath,
        self: state.self
    }
}

export default connect(mapStateToProps)(DropTarget('asset', assetTarget, collect)(Layer))
