import React, {Component} from 'react'
import { connect } from 'react-redux'
import {Puppet} from 'babble.js'

const { ipcRenderer } = window.require('electron')
const path = window.require('path')

class BackgroundInterface extends Component {
    constructor(props) {
        super(props)

        const {assets, assetsPath} = props
        ipcRenderer.send('background', 'update assets', assets, assetsPath)

        this.updateThumbnails = this.updateThumbnails.bind(this)
    }

    componentDidMount() {
        ipcRenderer.on('update thumbnails', this.updateThumbnails)
    }

    componentWillDismount() {
        ipcRenderer.off('update thumbnails', this.updateThumbnails)
    }

    componentWillReceiveProps(newProps) {
        const {assets, assetsPath, characters, thumbnailPaths} = newProps

        let updated = assetsPath !== this.props.assetsPath
        let updatedAssets = []

        Object.keys(this.props.assets).filter(id => !(id in assets) || assets[id] !== this.props.assets[id]).forEach(id => {
            updated = true
            if (this.props.assets[id].type === 'bundle' && (!(id in assets) || assets[id].version !== this.props.assets[id].version)) {
                updatedAssets.push(id)
            }
        })

        if (updated) {
            this.props.dispatch({
                type: 'INFO',
                content: 'Updating assets in background process...'
            })
            ipcRenderer.send('background', 'update assets', assets, assetsPath)
        }

        updatedAssets.forEach(id => {
            const asset = assets[id]
            this.props.dispatch({
                type: 'INFO',
                content: `Asset bundle "${asset.name}" (${id}) changed. Re-rendering dependent thumbnails...`
            })
            
            const handleLayer = layer => {
                if (layer.id === id)
                    return true
                if (layer.children)
                    return layer.children.find(handleLayer)
            }

            // Look for any asset bundles using it
            Object.keys(assets).filter(asset =>
                assets[asset].type === 'bundle' && asset !== id && assets[asset].layers.children.find(handleLayer) && !Puppet.handleLayer(assets, assets[id].layers, l => l.id === asset)).forEach(id => {
                const thumbnailsPath = path.join(thumbnailPaths.assets, asset.location.slice(0, -4))
                ipcRenderer.send('background', 'generate thumbnails', thumbnailsPath, assets[asset], 'asset', asset)
            })

            // Look for any characters using it
            Object.keys(characters).filter(char =>
                Puppet.handleLayer(assets, characters[char].layers, l => l.id === id)).forEach(id => {
                const character = characters[id]
                const thumbnailsPath = `${thumbnailPaths.characters}${id}`
                ipcRenderer.send('background', 'generate thumbnails', thumbnailsPath, character, 'puppet', id)
            })
        })
    }

    updateThumbnails(e, type, id, thumbnailsPath) {
        switch (type) {
        case 'puppet':
            this.props.dispatch({
                type: 'UPDATE_PUPPET_THUMBNAILS',
                id,
                thumbnailsPath
            })
            break
        case 'asset':
            this.props.dispatch({
                type: 'UPDATE_ASSET_THUMBNAILS',
                id,
                thumbnailsPath
            })
            break
        }
    }

    render() {
        return null
    }
}

function mapStateToProps(state) {
    return {
        assets: state.project.assets,
        assetsPath: state.project.assetsPath,
        characters: state.project.characters,
        thumbnailPaths: {
            assets: path.join(state.project.project, state.project.settings.assetsPath),
            characters: path.join(state.project.project, state.project.settings.charactersPath, '..', 'thumbnails', 'new-')
        }
    }
}

export default connect(mapStateToProps)(BackgroundInterface)
