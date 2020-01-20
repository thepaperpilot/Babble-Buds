import React, { Component } from 'react'
import { connect } from 'react-redux'
import classNames from 'classnames'
import { DropTarget } from 'react-dnd'
import { ContextMenuTrigger } from 'react-contextmenu'
import { open } from '../../redux/editor/editor'
import { addLayer } from '../../redux/editor/layers'
import { selectLayer } from '../../redux/editor/selected'

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
        this.props.dispatch(selectLayer(this.props.path))
    }

    editBundle() {
        if (this.props.asset && this.props.asset.type === 'bundle') {
            this.props.dispatch(open(this.props.id, this.props.asset.layers, 'asset'))
        }
    }

    render() {
        const {selected, asset, assetsPath, isOver, canDrop} = this.props
        const {path, id, name, children, nodeEmote, emotes, head, emoteLayer, inherit, tabs, emitter}
            = this.props
        
        // TODO context menu item to "recenter layer", which will only work on a layer
        // with children, and will move the parent layer's position so that its at the
        // center of where all its children are, and offset each child the opposite
        // direction to compensate.
        // Thus making scaling and rotating work in a more straightforward way
        const className = { layer: true, canDrop, isOver }
        if (comparePaths(selected.layer, path))
            className.selected = true

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
                (asset.conflicts.head && ('head' in inherit || head)) ||
                (asset.conflicts.emoteLayer && ('emoteLayer' in inherit || emoteLayer)) ||
                (asset.conflicts.emote && ('emote' in inherit || nodeEmote)) ||
                asset.conflicts.emotes.some(e => e in emotes && !comparePaths(emotes[e], path)))))
            className.warning = true

        const isBundle = asset && asset.type === 'bundle'

        const emote = nodeEmote != null ||
            (isBundle && asset.conflicts.emotes.length !== 0) ?
            <div className={selected.emote === nodeEmote ||
                (isBundle && asset.conflicts.emotes.includes(selected.emote)) ?
                'emote-layer visible' : 'emote-layer'} /> : null
        
        const bundle = isBundle ? <div className="asset-bundle" /> : null

        if (asset && asset.type === 'special')
            return <div
                className={classNames(className, 'special')}
                onClick={this.onNodeClick}>
                {name}
            </div>

        let element = null
        if (children == null) {
            if (asset) {
                element = <div>
                    <img src={join(assetsPath, `${asset.location}?version=${asset.version}`)}
                        alt={asset.name} />
                    {name}
                </div>
            } else if (emitter) {
                element = <div>{name}</div>
            }
        } else if (name) {
            element = <div>{name}</div>
        } else {
            element = <div>root</div>
        }

        return <ContextMenuTrigger
            id={`contextmenu-layer-${this.props.contextmenu}`}
            holdToDisplay={-1}
            collect={() => ({ path, name, tabs, assetId: id, asset })}>
            {this.props.connectDropTarget(<div className={classNames(className)}
                onClick={this.onNodeClick}
                onDoubleClick={this.editBundle}>
                {element}
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

        item.dispatch(addLayer(path, {
            id,
            leaf: true,
            name: asset.name
        }))
        
        item.dispatch(selectLayer([
            ...path,
            item.id ? item.path.slice(-1)[0] : item.children.length
        ]))
    },
    canDrop: (item, monitor) => {
        return item.emitter == null
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
        selected: state.editor.present.selected,
        asset: props.id === 'CHARACTER_PLACEHOLDER' ?
            CHARACTER_PLACEHOLDER : state.project.assets[props.id],
        assetsPath: state.project.assetsPath
    }
}

export default connect(mapStateToProps)(DropTarget('asset', assetTarget, collect)(Layer))
