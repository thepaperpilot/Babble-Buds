import React, { Component } from 'react'
import { connect } from 'react-redux'
import FlexLayout from 'flexlayout-react'
import BrokenPanel from './BrokenPanel'
import Assets from '../assets/Assets'
import Stage from '../stage/Stage'
import Console from '../console/Console'
import Puppets from '../puppets/Puppets'
import Controller from '../controller/Controller'
import ProjectSettings from '../settings/ProjectSettings'
import Inspector from '../inspector/Inspector'
import Editor from '../editor/Editor'
import Layers from '../layers/Layers'
import Environments from '../environments/Environments'
import { saveLayout, loadLayout } from '../../redux/settings'

import './icons/close_white.png'
import './icons/more.png'
import './icons/maximize.png'
import './icons/restore.png'

import './flexlayout-dark.css'
import './panels.css'

import defaultLayout from '../../data/default-layout.json'

const electron = window.require('electron')

class Panels extends Component {
    constructor(props) {
        super(props)

        this.layout = React.createRef()

        this.state = {
            model: FlexLayout.Model.fromJson(props.layout)
        }

        this.updateConfig = this.updateConfig.bind(this)
        this.onModelChange = this.onModelChange.bind(this)
        this.loadLayout = this.loadLayout.bind(this)
        this.togglePanel = this.togglePanel.bind(this)
    }

    factory(node) {
        const component = node.getComponent()
        const {grid, highlight} = node.getConfig() ? node.getConfig() : {}

        let child = null
        switch(component) {
        default:
        case 'text':
            child = <div className="panel">{node.getName()}</div>
            break
        case 'stage':
            child = <Stage
                ref={this.props.stage}
                assetUpdater={this.props.assetUpdater}
                rect={node._rect}
                id={node.getId()} />
            break
        case 'inspector':
            child = <Inspector id={node.getId()} />
            break
        case 'console':
            child = <Console/>
            break
        case 'puppets':
            child = <Puppets rect={node._rect}
                size={node.getConfig().size}
                onZoomChange={this.updateConfig(node, 'size')}
                id={node.getId()} />
            break
        case 'project-settings':
            child = <ProjectSettings/>
            break
        case 'assets':
            child = <Assets rect={node._rect} size={node.getConfig().size}
                onZoomChange={this.updateConfig(node, 'size')}
                id={node.getId()} />
            break
        case 'controller':
            child = <Controller id={node.getId()} />
            break
        case 'editor':
            child = <Editor rect={node._rect} grid={grid} highlight={highlight} 
                onZoomChange={this.updateConfig(node, 'grid')}
                onHighlightChange={this.updateConfig(node, 'highlight')} />
            break
        case 'layers':
            child = <Layers id={node.getId()} />
            break
        case 'environments':
            child = <Environments rect={node._rect} size={node.getConfig().size}
                onZoomChange={this.updateConfig(node, 'size')}
                id={node.getId()} />
            break
        }

        return <BrokenPanel panel={component}>{child}</BrokenPanel>
    }

    updateConfig(node, field) {
        return value => {
            node.getConfig()[field] = value
            this.props.dispatch(saveLayout(this.state.model.toJson()))
        }
    }

    onModelChange(model) {
        this.props.dispatch(saveLayout(model.toJson()))
    }

    componentDidMount() {
        electron.ipcRenderer.on('load layout', this.loadLayout)
        electron.ipcRenderer.on('toggle panel', this.togglePanel)
    }

    componentWillUnmount() {
        electron.ipcRenderer.removeListener('load layout', this.loadLayout)
        electron.ipcRenderer.removeListener('toggle panel', this.togglePanel)
    }

    componentWillReceiveProps(props) {
        this.setState({
            model: FlexLayout.Model.fromJson(props.layout)
        })
    }

    loadLayout(e, layout) {
        switch (layout) {
        case 'default':
            this.props.dispatch(loadLayout(defaultLayout))
            break
        default:
            break
        }
    }

    togglePanel(e, panel) {
        const tab = {
            component: panel,
            name: panel.replace(/-/g, ' ').split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
        }
        if (panel === 'puppets' || panel === 'assets' || panel === 'environments') {
            tab.config = {
                'size': 120
            }
        } else if (panel === 'editor') {
            tab.config = {
                'grid': 2
            }
        }

        this.layout.current.addTabWithDragAndDrop(tab.name, tab)
    }

    shouldComponentUpdate(newProps) {
        return this.props.layoutUpdate !== newProps.layoutUpdate
    }

    render() {
        return (
            <div className="flexlayout-container">
                <FlexLayout.Layout
                    ref={this.layout}
                    model={this.state.model}
                    factory={this.factory.bind(this)}
                    onModelChange={this.onModelChange} />
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        layout: state.settings.layout,
        layoutUpdate: state.settings.layoutUpdate
    }
}

export default connect(mapStateToProps)(Panels)
