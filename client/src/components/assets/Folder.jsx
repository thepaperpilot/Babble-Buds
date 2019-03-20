import React, {Component} from 'react'
import { connect } from 'react-redux'
import { DropTarget } from 'react-dnd'
import InlineEdit from './../ui/InlineEdit'
import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu'

import { getNewAssetID } from './../../reducers/project/assets'

const fs = window.require('fs-extra')
const path = require('path')
const {remote, ipcRenderer} = window.require('electron')
const settingsManager = remote.require('./main-process/settings')

class Folder extends Component {
    static id = 0

    constructor(props) {
        super(props)

        this.inlineEdit = React.createRef()

        this.focus = this.focus.bind(this)
        this.loadAssets = this.loadAssets.bind(this)
        this.addAsset = this.addAsset.bind(this)
        this.addAnimatedAsset = this.addAnimatedAsset.bind(this)
        this.renameFolder = this.renameFolder.bind(this)
        this.deleteFolder = this.deleteFolder.bind(this)
    }

    focus() {
        if (this.inlineEdit.current)
            this.inlineEdit.current.getWrappedInstance().edit()
    }

    loadAssets(assets, animated) {
        const statusId = `asset-${Folder.id++}`
        this.props.dispatch({
            type: 'IN_PROGRESS',
            count: assets.length,
            content: 'Adding new assets...',
            id: statusId
        })

        assets = assets.reduce((acc, curr) => {
            const name = curr.replace(/^.*[\\/]/, '')
                .replace(/.png/, '')
                .replace(/.gif/, '')
            const id = getNewAssetID()

            const asset = {
                type: animated ? 'animated' : 'sprite',
                tab: this.props.name,
                name,
                version: 0,
                panning: [],
                location: path.join(settingsManager.settings.uuid, `${id}.png`),
                // The following is temporary for use by the background process
                // and will be deleted before being added to the assets lists
                filepath: curr
            }

            if (animated)
                asset.thumbnail = path.join(settingsManager.settings.uuid,
                    `${id}.thumb.png`)

            acc[`${settingsManager.settings.uuid}:${id}`] = asset
            return acc
        }, {})
        const assetsPath = path.join(this.props.project, this.props.assetsPath)

        ipcRenderer.send('background', 'add assets',
            assets,
            assetsPath,
            statusId
        )
    }

    addAsset() {
        remote.dialog.showOpenDialog(remote.BrowserWindow.getFocusedWindow(), {
            title: 'Add Assets',
            filters: [
                {name: 'Image', extensions: ['png']}
            ],
            properties: [
                'openFile',
                'multiSelections'
            ]
        }, (filepaths) => {
            if (!filepaths) return
            this.loadAssets(filepaths, false)
        })
    }

    addAnimatedAsset() {
        remote.dialog.showOpenDialog(remote.BrowserWindow.getFocusedWindow(), {
            title: 'Add Animated Assets',
            filters: [
                {name: 'Animated Image', extensions: ['gif']},
                {name: 'Animated Spritesheet', extensions: ['png']}
            ],
            properties: [
                'openFile',
                'multiSelections'
            ]
        }, (filepaths) => {
            if (!filepaths) return
            this.loadAssets(filepaths, true)
        })
    }

    renameFolder(name) {
        Object.keys(this.props.assets).filter(id =>
            this.props.assets[id].tab === this.props.name).forEach(id => {
            const asset = this.props.assets[id]
            if (id.split(':')[0] === this.props.self) {
                this.props.dispatch({
                    type: 'MOVE_ASSET',
                    asset: id,
                    tab: name
                })
            } else {
                this.props.dispatch({
                    type: 'WARN',
                    content: `Unable to move asset "${asset.name}" because its owned by someone else. Please duplicate the asset and remove the original and try again.`
                })
            }
        })
    }

    deleteFolder() {
        // TODO can't delete other people's assets IF we're connected to other people
        this.props.dispatch({
            type: 'DELETE_TAB',
            tab: this.props.name
        })
    }

    render() {
        return <div onDragOver={console.log}>
            <ContextMenuTrigger
                id={`contextmenu-tab-${this.props.name}`}
                holdToDisplay={-1}>
                {this.props.connectDropTarget(<div style={{
                    backgroundColor: this.props.isOver ? 'rgba(0, 255, 0, .2)' :
                        this.props.canDrop ? 'rgba(0, 255, 0, .05)' : ''
                }}>
                    <InlineEdit
                        ref={this.inlineEdit}
                        target={this.props.name}
                        selectable={false}
                        className="header"
                        onChange={this.renameFolder} />
                </div>)}
            </ContextMenuTrigger>
            <ContextMenu id={`contextmenu-tab-${this.props.name}`}>
                <MenuItem onClick={this.focus}>Rename</MenuItem>
                <MenuItem onClick={this.deleteFolder}>Delete</MenuItem>
                <MenuItem onClick={this.addAsset}>Add Asset</MenuItem>
                <MenuItem onClick={this.addAnimatedAsset}>Add Animated Asset</MenuItem>
            </ContextMenu>
        </div>
    }
}

const assetTarget = {
    drop(props, monitor) {
        props.dispatch({
            type: 'MOVE_ASSET',
            asset: monitor.getItem().asset,
            tab: props.name
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

function mapStateToProps(state) {
    return {
        assets: state.project.assets,
        project: state.project.project,
        assetsPath: state.project.settings.assetsPath,
        self: state.self
    }
}

export default DropTarget('asset', assetTarget, collect)(connect(mapStateToProps, null, null, { withRef: true })(Folder))
