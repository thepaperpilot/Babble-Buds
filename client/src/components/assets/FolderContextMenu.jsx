import React, {Component} from 'react'
import { connect } from 'react-redux'
import { ContextMenu, MenuItem, connectMenu } from 'react-contextmenu'
import { getNewAssetID } from '../../redux/project/assets/reducers'
import { removeFolder } from '../../redux/project/folders'
import { inProgress } from '../../redux/status'

const path = require('path')
const {remote, ipcRenderer} = window.require('electron')
const settingsManager = remote.require('./main-process/settings')

class FolderContextMenu extends Component {
    static id = 0

    constructor(props) {
        super(props)

        this.focus = this.focus.bind(this)
        this.loadAssets = this.loadAssets.bind(this)
        this.addAsset = this.addAsset.bind(this)
        this.addAnimatedAsset = this.addAnimatedAsset.bind(this)
        this.deleteFolder = this.deleteFolder.bind(this)
    }

    focus() {
        if (this.props.trigger.inlineEdit.current)
            this.props.trigger.inlineEdit.current.getWrappedInstance().edit()
    }

    loadAssets(assets, animated, tab) {
        const statusId = `asset-${FolderContextMenu.id++}`
        this.props.dispatch(inProgress(statusId, assets.length, 'Adding new assets...'))

        assets = assets.reduce((acc, curr) => {
            const name = curr.replace(/^.*[\\/]/, '')
                .replace(/.png/, '')
                .replace(/.gif/, '')
            const id = getNewAssetID()

            const asset = {
                type: animated ? 'animated' : 'sprite',
                tab,
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
        // Store tab now because the trigger will be empty once the dialog is closed
        const tab = this.props.trigger.tab
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
            this.loadAssets(filepaths, false, tab)
        })
    }

    addAnimatedAsset() {
        // Store tab now because the trigger will be empty once the dialog is closed
        const tab = this.props.trigger.tab
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
            this.loadAssets(filepaths, true, tab)
        })
    }

    deleteFolder() {
        this.props.dispatch(removeFolder(this.props.trigger.tab, true))
    }

    render() {
        return <ContextMenu id={this.props.id}>
            <MenuItem onClick={this.focus}>Rename</MenuItem>
            <MenuItem onClick={this.deleteFolder}>Delete</MenuItem>
            <MenuItem onClick={this.addAsset}>Add Asset</MenuItem>
            <MenuItem onClick={this.addAnimatedAsset}>Add Animated Asset</MenuItem>
        </ContextMenu>
    }
}

function mapStateToProps(state) {
    return {
        project: state.project.project,
        assetsPath: state.project.settings.assetsPath
    }
}

export default id => connect(mapStateToProps, null, null, { forwardRef: true })(connectMenu(`contextmenu-tab-${id}`)(FolderContextMenu))
