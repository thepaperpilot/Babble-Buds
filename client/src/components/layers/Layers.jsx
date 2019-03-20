import React, {Component} from 'react'
import { connect } from 'react-redux'
import Scrollbar from 'react-custom-scroll'
import Tree from '@robertlong/react-ui-tree'
import { ActionCreators as UndoActionCreators } from 'redux-undo'
import Layer from './Layer'
import './layers.css'

class Layers extends Component {
    constructor(props) {
        super(props)

        this.state = {
            tabs: this.calculateTabs(props)
        }

        this.handleChange = this.handleChange.bind(this)
        this.addLayer = this.addLayer.bind(this)
        this.renderNode = this.renderNode.bind(this)
        this.calculateTabs = this.calculateTabs.bind(this)
    }

    componentWillReceiveProps(props) {
        if (props.assets !== this.props.assets)
            this.setState({
                tabs: this.calculateTabs(props)
            })
    }

    handleChange(tree) {
        this.props.dispatch({
            type: 'SET_LAYERS',
            tree
        })
        this.props.dispatch(UndoActionCreators.clearHistory())
        if (this.props.targetType === 'layer')
            this.props.dispatch({
                type: 'INSPECT',
                targetType: 'layer',
                target: this.props.selected
            })
    }

    addLayer() {
        this.props.dispatch({
            type: 'ADD_LAYER',
            path: []
        })
    }

    renderNode(node) {
        return <Layer {...node} nodeEmote={node.emote} tabs={this.state.tabs} />
    }



    calculateTabs(props) {
        return Object.values(props.assets).reduce((acc, curr) =>
            acc.includes(curr.tab) ? acc : acc.concat(curr.tab), [])
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
        tree: state.editor.present.character ? state.editor.present.character.layers : {},
        selected: state.editor.layer,
        assets: state.project.assets
    }
}

export default connect(mapStateToProps)(Layers)
