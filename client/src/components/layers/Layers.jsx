import React, { Component } from 'react'
import { connect } from 'react-redux'
import Scrollbar from 'react-custom-scroll'
import Tree from 'react-ui-tree'
import { Puppet } from 'babble.js'
import Layer from './Layer'
import LayerContextMenu from './LayerContextMenu'
import { setLayers, addLayer } from '../../redux/editor/layers'

import './layers.css'

export function calculateEmotes(assets, layers) {
    const emotes = {}
    Puppet.handleLayer(assets, layers, (layer, bundles) => {
        if (bundles.length > 0)
            return
        if (layer.emote != null && !(layer.emote in emotes)) {    
            emotes[layer.emote] = layer
        } else if (layer.id && layer.id in assets) {
            const asset = assets[layer.id]
            if (asset.type === 'bundle')
                asset.conflicts.emotes.forEach(e => {
                    if (!(e in emotes))
                        emotes[e] = layer
                })
        }
    })
    return emotes
}

function reverseTree(tree) {
    function handleLayer(layer) {
        layer = Object.assign({}, layer)
        if (layer.children)
            layer.children = layer.children.map(handleLayer).reverse()
        return layer
    }
    return handleLayer(tree)
}

function reverseEmitterTree(emitters) {
    return { children: emitters.map((emitter, i) => ({ name: emitter.name, emitter, leaf: "true", path: [i] })) }
}

function getEmitters(tree) {
    return tree.children.map(node => node.emitter)
}

class Layers extends Component {
    constructor(props) {
        super(props)

        this.state = {
            emotes: this.calculateEmotes(props)
        }

        this.handleChange = this.handleChange.bind(this)
        this.handleEmitterChange = this.handleEmitterChange.bind(this)
        this.addLayer = this.addLayer.bind(this)
        this.canBecomeParent = this.canBecomeParent.bind(this)
        this.renderNode = this.renderNode.bind(this)
        this.renderEmitterNode = this.renderEmitterNode.bind(this)
        this.calculateEmotes = this.calculateEmotes.bind(this)
    }

    componentWillReceiveProps(props) {
        const emotes = this.calculateEmotes(props)
        this.setState({ emotes })
    }

    handleChange(tree) {
        this.props.dispatch(setLayers(reverseTree(tree)))
    }

    handleEmitterChange(tree) {
        this.props.dispatch(setLayers(getEmitters(tree)))
    }

    addLayer() {
        this.props.dispatch(addLayer([]))
    }

    renderNode(node) {
        return <Layer {...node} contextmenu={this.props.id}
            nodeEmote={node.emote} tabs={this.props.folders} emotes={this.state.emotes} />
    }

    renderEmitterNode(node) {
        return <Layer {...node} contextmenu={this.props.id} />
    }

    canBecomeParent(parent, child) {
        const { emote, head, emoteLayer, id } = child
        const inh = Object.assign({}, parent.inherit)

        if (parent.emote != null) inh.emote = parent.emote
        if (parent.head != null) inh.head = parent.head
        if (parent.emoteLayer != null) inh.emoteLayer = parent.emoteLayer

        if (inh.emote != null && emote != null)
            return false
        if (inh.head != null && head != null)
            return false
        if (inh.emoteLayer != null && emoteLayer != null)
            return false
        if (id === 'CHARACTER_PLACEHOLDER' && parent.path && parent.path.length)
            return false

        return true
    }

    calculateEmotes(props) {
        if (props.tree.children) {
            const emotes = calculateEmotes(props.assets, props.tree)
            Object.keys(emotes).forEach(e => emotes[e] = emotes[e].path)
            return emotes
        }
        return {}
    }

    render() {
        // We don't want the ui tree modifying the tree object stored in redux because then it won't re-render everything properly
        // So we have to clone it using JSON parse and stringify
        const LinkedLayerContextMenu = LayerContextMenu(this.props.id)

        let element, disabled
        if (Array.isArray(this.props.tree)) {
            disabled = false
            element = <Scrollbar allowOuterScroll={true} heightRelativeToParent="100%">
                <Tree
                    tree={reverseEmitterTree(this.props.tree)}
                    onChange={this.handleEmitterChange}
                    renderNode={this.renderEmitterNode}
                    autoscroll={50}
                    canBecomeParent={() => false} />
            </Scrollbar>
        } else if (this.props.tree.children) {
            disabled = false
            element = <Scrollbar allowOuterScroll={true} heightRelativeToParent="100%">
                <Tree
                    tree={reverseTree(this.props.tree)}
                    onChange={this.handleChange}
                    renderNode={this.renderNode}
                    autoscroll={50}
                    canBecomeParent={this.canBecomeParent}
                    storeCollapsedInState={true} />
            </Scrollbar>
        } else {
            disabled = true
            element = <div className="default">Open puppet to edit layers</div>
        }

        return <div className="panel console">
            <div className="bar flex-row">
                <button onClick={this.addLayer} disabled={disabled}>New Layer</button>
                <div className="flex-grow" />
            </div>
            {element}
            <LinkedLayerContextMenu />
        </div>
    }
}

function mapStateToProps(state) {
    return {
        tree: state.editor.present.layers ? state.editor.present.layers : {},
        assets: state.project.assets,
        folders: state.project.folders
    }
}

export default connect(mapStateToProps)(Layers)
