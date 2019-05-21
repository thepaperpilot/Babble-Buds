import React, {Component} from 'react'
import { connect } from 'react-redux'
import { ContextMenu, MenuItem, connectMenu } from 'react-contextmenu'

import { getNewAssetID } from './../../reducers/project/assets'

const path = require('path')
const {remote, ipcRenderer} = window.require('electron')
const settingsManager = remote.require('./main-process/settings')

const MENU_TYPE = 'contextmenu-tab'

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
            console.log(this.props)

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
        // TODO can't delete other people's assets IF we're connected to other people
        this.props.dispatch({
            type: 'DELETE_TAB',
            tab: this.props.trigger.tab
        })
    }

    render() {
        return <ContextMenu id={MENU_TYPE}>
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

export default connect(mapStateToProps, null, null, { withRef: true })(connectMenu(MENU_TYPE)(FolderContextMenu))
