import React, {Component} from 'react'
import { connect } from 'react-redux'
import Scrollbar from 'react-custom-scroll'
import Tree from 'react-ui-tree'
import Layer from './Layer'
import LayerContextMenu from './LayerContextMenu'
import './layers.css'

class Layers extends Component {
    constructor(props) {
        super(props)

        this.state = {
            tabs: this.calculateTabs(props),
            emotes: this.calculateEmotes(props)
        }

        this.handleChange = this.handleChange.bind(this)
        this.addLayer = this.addLayer.bind(this)
        this.canBecomeParent = this.canBecomeParent.bind(this)
        this.renderNode = this.renderNode.bind(this)
        this.calculateTabs = this.calculateTabs.bind(this)
        this.calculateEmotes = this.calculateEmotes.bind(this)
    }

    componentWillReceiveProps(props) {
        if (props.assets !== this.props.assets)
            this.setState({
                tabs: this.calculateTabs(props)
            })
        
        const emotes = this.calculateEmotes(props)
        if (emotes !== this.state.emotes)
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
            nodeEmote={node.emote} tabs={this.state.tabs} emotes={this.state.emotes} />
    }

    canBecomeParent(parent, child) {
        const { emote, head, emoteLayer } = child
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

        return true
    }

    calculateTabs(props) {
        return Object.values(props.assets).reduce((acc, curr) =>
            acc.includes(curr.tab) ? acc : acc.concat(curr.tab), [])
    }

    calculateEmotes(props) {
        const emotes = {}
        const reducer = layer => {
            if (layer.emote != null && !(layer.emote in emotes))
                emotes[layer.emote] = layer
            if (layer.children)
                layer.children.forEach(reducer)
            else if (props.assets[layer.id].type === 'bundle')
                props.assets[layer.id].layers.children.forEach(reducer)
        }
        if (props.tree.children)
            props.tree.children.forEach(reducer)
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
        assets: state.project.assets
    }
}

export default connect(mapStateToProps)(Layers)
