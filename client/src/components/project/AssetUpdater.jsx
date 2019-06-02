import React, {Component} from 'react'
import { connect } from 'react-redux'

const babble = require('babble.js')

class AssetUpdater extends Component {
    constructor(props) {
        super(props)

        this.puppetLoaders = []
        this.loaded = false

        this.addPuppetLoader = this.addPuppetLoader.bind(this)
        this.loadPuppets = this.loadPuppets.bind(this)
    }

    componentDidMount() {
        this.stage = new babble.Stage('assetupdater', this.props.settings, this.props.assets, this.props.assetsPath, this.loadPuppets)
    }

    componentWillReceiveProps(newProps) {
        this.stage.assets = newProps.assets
        this.stage.assetsPath = newProps.assetsPath
        this.stage.reloadAssets()
    }

    addPuppetLoader(callback) {
        if (this.loaded) {
            callback(this.stage)
        } else {
            this.puppetLoaders.push(callback)
        }
    }

    loadPuppets(stage) {
        this.puppetLoaders.forEach(c => c(stage))
        this.loaded = true
    }

    render() {
        return <div id="assetupdater"></div>
    }
}

function mapStateToProps(state) {
    return {
        settings: state.project.settings,
        assets: state.project.assets,
        assetsPath: state.project.assetsPath,
    }
}

export default connect(mapStateToProps, null, null, { withRef: true })(AssetUpdater)
