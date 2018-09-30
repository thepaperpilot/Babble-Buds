import React, {Component} from 'react'
import { connect } from 'react-redux'

const { ipcRenderer } = window.require('electron')

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
        const {assets, assetsPath} = newProps
        ipcRenderer.send('background', 'update assets', assets, assetsPath)
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
        assetsPath: state.project.assetsPath
    }
}

export default connect(mapStateToProps)(BackgroundInterface)
