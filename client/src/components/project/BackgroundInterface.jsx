import { Component } from 'react'
import { connect } from 'react-redux'
import { Puppet } from 'babble.js'
import { info } from '../../redux/status'
import { updateThumbnail } from '../../redux/project/characterThumbnails'
import { updateThumbnail as updateAssetThumbnail} from '../../redux/project/assets/actions'

const { ipcRenderer } = window.require('electron')
const path = window.require('path')

class BackgroundInterface extends Component {
    constructor(props) {
        super(props)

        this.hasUpdated = false

        this.updateThumbnails = this.updateThumbnails.bind(this)
        this.checkDirtyCharacters = this.checkDirtyCharacters.bind(this)
    }

    componentDidMount() {
        this.props.dispatch(info('Updating assets in background process...'))
        ipcRenderer.send('background', 'update assets', this.props.assets, this.props.assetsPath)

        ipcRenderer.on('update thumbnails', this.updateThumbnails)
        this.checkDirtyCharacters(this.props, this.props.dirtyCharacters)
    }

    componentWillUnmount() {
        this.hasUpdated = false
        ipcRenderer.off('update thumbnails', this.updateThumbnails)
    }

    componentWillReceiveProps(newProps) {
        const { assets, assetsPath, characters, environments, thumbnailPaths } = newProps

        // Since we try to get the first project loaded ASAP, we don't necessarily
        // wait for BackgroundInterface to be set up before generating any
        // necessary thumbnails. That, of course, causes problems since we
        // need to give the background window its assets and such first
        // So, instead we get this list of characters whose thumbnails
        // need to be regenerated, and we regenerate them... once. After that, we
        // just ignore that prop so we don't need to reset it in project back
        // to the empty array, causing another render we don't need. 
        const dirtyCharacters = this.hasUpdated ? [] : newProps.dirtyCharacters

        let updated = assetsPath !== this.props.assetsPath
        let updatedAssets = []

        Object.keys(this.props.assets).filter(id =>
            // asset doesn't exist in new assets list (it got deleted)
            !(id in assets) ||
            // asset was changed
                assets[id] !== this.props.assets[id]).forEach(id => {
            updated = true
            // If the asset was a bundle
            if (this.props.assets[id].type === 'bundle' &&
                // and was either deleted or has incremented the version field
                (!(id in assets) || assets[id].version !== this.props.assets[id].version)) {
                updatedAssets.push(id)
            }
        })

        if (updated && Object.keys(assets).length > 0) {
            this.props.dispatch(info('Updating assets in background process...'))
            ipcRenderer.send('background', 'update assets', assets, assetsPath)
        }

        updatedAssets.forEach(id => {
            const asset = assets[id] || this.props.assets[id]
            this.props.dispatch(info(`Asset bundle "${asset.name}" (${id}) changed. Re-rendering dependent thumbnails...`))
            
            const handleLayer = layer => {
                if (layer.id === id)
                    return true
                if (layer.children)
                    return layer.children.find(handleLayer)
            }

            // Look for any asset bundles using it
            Object.keys(assets).filter(asset =>
                asset in assets && 
                // Check if this asset is a bundle
                assets[asset].type === 'bundle' &&
                // And its not the updated asset
                asset !== id &&
                // and it contains the updated asset
                assets[asset].layers.children.find(handleLayer) &&
                // and the updated asset doesn't contain this asset
                // (otherwise they'd constantly update each other endlessly)
                !Puppet.handleLayer(assets, assets[id].layers, l => l.id === asset)
            ).forEach(id => {
                const thumbnailsPath = path.join(thumbnailPaths.assets,
                    asset.location.slice(0, -4))
                ipcRenderer.send('background', 'generate thumbnails', thumbnailsPath,
                    assets[asset], 'asset', asset)
            })

            // Look for any characters using it
            Object.keys(characters).filter(char =>
                Puppet.handleLayer(assets, characters[char].layers, l => l.id === id) &&
                !(id in dirtyCharacters)
            ).forEach(id => {
                dirtyCharacters.push(id)
            })
            // aaaand environments!
            Object.keys(environments).filter(env =>
                Puppet.handleLayer(assets, environments[env].layers, l => l.id === id) &&
                !(id in dirtyCharacters)
            ).forEach(id => {
                dirtyCharacters.push(id)
            })
        })

        // Regenerate characters that need it
        this.checkDirtyCharacters(newProps, dirtyCharacters)
    }

    checkDirtyCharacters(props, dirtyCharacters) {
        if (dirtyCharacters.length) {
            const {characters, environments, thumbnailPaths} = props

            dirtyCharacters.forEach(id => {
                const character = characters[id] || environments[id]
                const thumbnailsPath = `${thumbnailPaths.characters}${id}`
                ipcRenderer.send('background', 'generate thumbnails', thumbnailsPath,
                    character, id in characters ? 'puppet' : 'environment', id)
            })

            if (props.dirtyCharacters.length && !this.hasUpdated)
                this.hasUpdated = true
        }
    }

    updateThumbnails(e, type, id, thumbnailsPath) {
        if (type === 'asset')
            this.props.dispatch(updateAssetThumbnail(id, thumbnailsPath))
        else
            this.props.dispatch(updateThumbnail(id, type, thumbnailsPath))
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
        environments: state.project.environments,
        dirtyCharacters: state.project.dirtyCharacters,
        thumbnailPaths: {
            assets: path.join(state.project.project, state.project.settings.assetsPath),
            characters: path.join(state.project.project,
                state.project.settings.charactersPath, '..', 'thumbnails', 'new-')
        }
    }
}

export default connect(mapStateToProps)(BackgroundInterface)
