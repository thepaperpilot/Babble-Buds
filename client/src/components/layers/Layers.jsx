import React, {Component} from 'react'
import { connect } from 'react-redux'
import Scrollbar from 'react-custom-scroll'
import Tree from 'react-ui-tree'
import {Puppet} from 'babble.js'
import Layer from './Layer'
import LayerContextMenu from './LayerContextMenu'
import './layers.css'

class Layers extends Component {
    constructor(props) {
        super(props)

        this.state = {
            emotes: this.calculateEmotes(props)
        }

        this.handleChange = this.handleChange.bind(this)
        this.addLayer = this.addLayer.bind(this)
        this.canBecomeParent = this.canBecomeParent.bind(this)
        this.renderNode = this.renderNode.bind(this)
        this.calculateEmotes = this.calculateEmotes.bind(this)
    }

    componentWillReceiveProps(props) {
        const emotes = this.calculateEmotes(props)
        this.setState({ emotes })
    }

    handleChange(tree) {
        // The callback is used to allow us to trigger another action after this one completes
        // Specifically, we want to take the newly calculated path SET_LAYERS generates for
        // the currently selected layer, and select it
        this.props.dispatch({
            type: 'SET_LAYERS',
            tree,
            callback: path => {
                if (this.props.targetType === 'layer' && path)
                    this.props.dispatch({
                        type: 'SELECT_LAYER',
                        path
                    })
            }
        })
    }

    addLayer() {
        this.props.dispatch({
            type: 'ADD_LAYER',
            path: []
        })
    }

    renderNode(node) {
        return <Layer {...node} contextmenu={this.props.id}
            nodeEmote={node.emote} tabs={this.props.folders} emotes={this.state.emotes} />
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
        if (id === 'CHARACTER_PLACEHOLDER' && parent.path.length)
            return false

        return true
    }

    calculateEmotes(props) {
        const emotes = {}
        if (props.tree.children)
            Puppet.handleLayer(props.assets, props.tree, (layer, bundles) => {
                if (layer.emote != null && !(layer.emote in emotes)) {
                    emotes[layer.emote] = bundles[0] ?
                        props.tree.children.find(l => l.id === bundles[0]).path :
                        layer.path
                }
            })
        return emotes
    }

    render() {
        // We don't want the ui tree modifying the tree object stored in redux because then it won't re-render everything properly
        // So we have to clone it using JSON parse and stringify
        const LinkedLayerContextMenu = LayerContextMenu(this.props.id)
        return (
            <div className="panel console">
                <div className="bar flex-row">
                    <button onClick={this.addLayer}>New Layer</button>
                    <div className="flex-grow" />
                </div>
                {this.props.tree.path ?
                    <Scrollbar allowOuterScroll={true} heightRelativeToParent="100%">
                        <Tree
                            tree={JSON.parse(JSON.stringify(this.props.tree))}
                            onChange={this.handleChange}
                            renderNode={this.renderNode}
                            autoscroll={50}
                            canBecomeParent={this.canBecomeParent} />
                    </Scrollbar> :
                    <div className="default">Open puppet to edit layers</div>}
                <LinkedLayerContextMenu />
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        targetType: state.inspector.targetType,
        tree: state.editor.present.character ? state.editor.present.character.layers : {},
        selected: state.editor.present.layer,
        assets: state.project.assets,
        folders: state.project.settings.folders
    }
}

export default connect(mapStateToProps)(Layers)
