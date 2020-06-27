import React, {Component} from 'react'
import { connect } from 'react-redux'
import { ContextMenu, MenuItem, connectMenu } from 'react-contextmenu'
import { getNewAssetID } from '../../redux/project/assets/reducers'
import { removeFolder } from '../../redux/project/folders'
import { newParticleEffect } from '../../redux/project/assets/actions'

const remote = window.require('electron').remote

class FolderContextMenu extends Component {
    constructor(props) {
        super(props)

        this.focus = this.focus.bind(this)
        this.addAsset = this.addAsset.bind(this)
        this.newParticleEffect = this.newParticleEffect.bind(this)
        this.deleteFolder = this.deleteFolder.bind(this)
    }

    focus() {
        if (this.props.trigger.inlineEdit.current)
            this.props.trigger.inlineEdit.current.edit()
    }

    async addAsset() {
        // Store tab now because the trigger will be empty once the dialog is closed
        const tab = this.props.trigger.tab
        const result = await remote.dialog.showOpenDialog(remote.BrowserWindow.getFocusedWindow(), {
            title: 'Add Assets',
            filters: [
                {name: 'All Formats', extensions: ['png', 'gif', 'json']},
                {name: 'Image', extensions: ['png']},
                {name: 'Animated Image', extensions: ['gif']},
                {name: 'Particle Effect', extensions: ['json']}
            ],
            properties: [
                'openFile',
                'multiSelections'
            ]
        })

        if (result.filePaths.length) {
            this.props.loadAssets(result.filePaths, tab)
        }
    }

    newParticleEffect() {
        this.props.dispatch(newParticleEffect(this.props.trigger.tab))
    }

    deleteFolder() {
        this.props.dispatch(removeFolder(this.props.trigger.tab, true))
    }

    render() {
        return <ContextMenu id={this.props.id}>
            <MenuItem onClick={this.focus}>Rename</MenuItem>
            <MenuItem onClick={this.deleteFolder}>Delete</MenuItem>
            <MenuItem onClick={this.addAsset}>Add Asset</MenuItem>
            <MenuItem onClick={this.newParticleEffect}>New Particle Effect Asset</MenuItem>
        </ContextMenu>
    }
}

export default id => connect(null, null, null, { forwardRef: true })(connectMenu(`contextmenu-tab-${id}`)(FolderContextMenu))
