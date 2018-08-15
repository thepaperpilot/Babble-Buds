import React, {Component} from 'react'
import { connect } from 'react-redux'
import Scrollbar from 'react-custom-scroll'
import Tree from '@robertlong/react-ui-tree'
import classNames from 'classnames'
import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu'
import './layers.css'

const path = require('path')

class Layers extends Component {
    constructor(props) {
        super(props)

        this.handleChange = this.handleChange.bind(this)
        this.onNodeClick = this.onNodeClick.bind(this)
        this.editLayer = this.editLayer.bind(this)
        this.addLayer = this.addLayer.bind(this)
        this.renderNode = this.renderNode.bind(this)
    }

    handleChange(tree) {
        this.props.dispatch({
            type: 'SET_LAYERS',
            tree
        })
        if (this.props.targetType === 'layer')
            this.props.dispatch({
                type: 'INSPECT',
                targetType: 'layer',
                target: this.props.selected
            })
    }

    onNodeClick(node) {
        this.props.dispatch({
            type: 'SELECT_LAYER',
            path: node.path
        })
    }

    editLayer(type, path) {
        return () => {
            this.props.dispatch({
                type,
                path
            })
        }
    }

    addLayer() {
        this.props.dispatch({
            type: 'ADD_LAYER',
            path: []
        })
    }

    renderNode(node) {
        const className = ['layer']
        if (JSON.stringify(this.props.selected) === JSON.stringify(node.path))
            className.push('selected')
        const key = node.children == null ? node.id : node.name
        const emote = node.emote != null && node.inherit.emote == null ? <div className={this.props.emote === node.emote ? 'emote-layer visible' : 'emote-layer'} /> : null
        return <div>
            <ContextMenuTrigger id={`contextmenu-layer-${JSON.stringify(node.path)}`} holdToDisplay={-1}>
                <div className={classNames(className)} key={key} onClick={this.onNodeClick.bind(null, node)}>
                    {node.children == null ?
                        this.props.assets[node.id] ?
                            <div>
                                <img src={path.join(this.props.assetsPath, this.props.assets[node.id].location)}
                                    alt={this.props.assets[node.id].name} />
                                {node.name}
                            </div> : null :
                        node.name ? <div>{node.name}</div> : <div>root</div>}
                    {emote}
                </div>
            </ContextMenuTrigger>
            <ContextMenu id={`contextmenu-layer-${JSON.stringify(node.path)}`}>
                <MenuItem onClick={this.editLayer('DELETE_LAYER', node.path)}>Delete Layer</MenuItem>
                <MenuItem onClick={this.editLayer('WRAP_LAYER', node.path)}>Wrap Layer</MenuItem>
                {node.id == null && <MenuItem onClick={this.editLayer('ADD_LAYER', node.path)}>Add Layer</MenuItem>}
            </ContextMenu>
        </div>
    }

    render() {
        return (
            <div className="panel console">
                <div className="bar flex-row">
                    <button onClick={this.addLayer}>New Layer</button>
                    <div className="flex-grow" />
                </div>
                <Scrollbar allowOuterScroll={true} heightRelativeToParent="100%">
                    <Tree
                        tree={this.props.tree}
                        onChange={this.handleChange}
                        renderNode={this.renderNode} />
                </Scrollbar>
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        targetType: state.inspector.targetType,
        assets: state.project.assets,
        assetsPath: state.project.assetsPath,
        tree: state.editor.character ? state.editor.character.layers : [],
        selected: state.editor.layer,
        emote: state.editor.emote
    }
}

export default connect(mapStateToProps)(Layers)
