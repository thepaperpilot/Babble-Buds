import React, { Component } from 'react'
import { connect } from 'react-redux'
import Checkbox from '../inspector/fields/Checkbox'
import Number from '../inspector/fields/Number'
import Foldable from '../ui/Foldable'
import { getEmotes } from '../controller/Emotes'
import { loadCharacters, loadAssets } from '../../redux/project/loader'
import { warn, inProgress } from '../../redux/status'
import Importer from '../ui/Importer'

import './../puppets/importer.css'

const fs = window.require('fs-extra')
const path = require('path')
const ipcRenderer = window.require('electron').ipcRenderer

class EnvironmentImporter extends Component {
    static id = 0

    constructor(props) {
        super(props)

        this.state = {
            assets: {},
            characterThumbnails: {},
            assetsPaths: {}
        }

        this.createElement = this.createElement.bind(this)
        this.resetImporter = this.resetImporter.bind(this)
        this.readFile = this.readFile.bind(this)
        this.import = this.import.bind(this)
    }

    createElement({ id, item, selected, toggleItem, singleItem }) {
        return <div key={id} className="puppet-importer-title">
            <div className="puppet-importer-img char">
                <img
                    alt={item.name}
                    src={this.state.characterThumbnails[id]}
                    style={{width: '120px', height: '120px', border: '1px solid'}} />
            </div>
            <div className="puppet-importer-label">
                <p>{item.name}</p>
                <p>Number of Slots: {item.numCharacters}</p>
                <p>Puppet Scale: {item.puppetScale}</p>
            </div>
            {singleItem ? null : <Checkbox
                inline={true}
                value={selected}
                onChange={toggleItem(id)}/>}
        </div>
    }

    resetImporter() {
        this.setState({
            assets: {},
            characterThumbnails: {},
            assetsPath: {}
        })
    }

    readFile(filepath) {
        const project = fs.readJsonSync(filepath)
        const puppetsPath = path.join(filepath, project.charactersPath || '../characters')
        const {
            environments: rawEnvironments,
            characterThumbnails: rawThumbnails
        } = loadCharacters(project, puppetsPath, this.props.defaults)

        if (Object.values(rawEnvironments).length === 0) {
            this.props.dispatch(warn(`No environments found in ${path.basename(filepath)} to import`))
            return null
        }

        const environments = {}
        const characterThumbnails = {}
        Object.values(rawEnvironments).forEach((environment, i) => {
            const id = this.props.numCharacters + i + 1
            characterThumbnails[id] = rawThumbnails[environment.id] || ''
            environment.id = id
            environments[id] = environment
        })

        const assetsPath = path.join(filepath, project.assetsPath || '../assets')
        const { assets, error, errors } = loadAssets(project, assetsPath, environments)
        if (error)
            this.props.dispatch(warn(error))
        if (errors)
            errors.forEach(e => this.props.dispatch(warn(e)))

        this.setState({
            assets: {...this.state.assets, ...assets},
            characterThumbnails: {...this.state.characterThumbnails, ...characterThumbnails},
            assetsPaths: {...this.state.assetsPaths, [filepath]: assetsPath}
        })

        return environments
    }

    import(filepath, items) {
        const assets = {}
        const puppetsStatusId = `import-environment-${EnvironmentImporter.id++}`
        const assetsStatusId = `${puppetsStatusId}-assets`

        const checkLayer = (environment, layer) => {
            if (layer == null || !Array.isArray(layer.children)) return
            layer.children.forEach(layer => {
                // Continue searching through the layers
                checkLayer(environment, layer)

                // Ensure this is a new asset
                if (!('id' in layer)) return
                if (layer.id in this.props.assets) return
                if (layer.id in assets) return
                if (layer.id === 'CHARACTER_PLACEHOLDER') return

                // Add asset to the appropriate lists
                assets[layer.id] = this.state.assets[layer.id]
                environment.assets.push(layer.id)
            })
        }

        const environments = Object.keys(items).reduce((acc, curr) => {
            const thumbnail = this.state.characterThumbnails[curr].slice(8)
            const thumbFolder = thumbnail.split('.').slice(0, -1).join('.')

            acc[curr] = items[curr]
            // These are temporary variables for use in the background
            // process that will be removed before adding them to the
            // environment list
            acc[curr].thumbnail = thumbnail
            acc[curr].thumbFolder = thumbFolder
            acc[curr].assets = []

            // Import any assets this character has that we don't have
            checkLayer(acc[curr], items[curr].layers)

            return acc
        }, {})

        // Create status messages for showing progress on importing puppets
        this.props.dispatch(inProgress(puppetsStatusId, Object.keys(environments).length, 'Importing environments...'))
        if (Object.keys(assets).length > 0)
            this.props.dispatch(inProgress(assetsStatusId, Object.keys(assets).length, 'Importing assets...'))

        // Make the background window copy all the necessary files over
        ipcRenderer.send('background', 'add characters',
            // Puppets to add
            environments,
            // Assets to add
            assets,
            // Assets path to copy assets from
            this.state.assetsPaths[filepath],
            // Assets path to move assets to
            path.join(this.props.project, this.props.assetsPath),
            // Thumbnails path to save thumbnails to
            path.join(this.props.project, this.props.charactersPath, '..', 'thumbnails'),
            // ID for sending status updates as new puppets get added
            puppetsStatusId,
            // ID for sending status updates as new assets get added
            assetsStatusId,
            // Specify that these are environments we're adding
            'environment'
        )
    }

    shouldComponentUpdate() {
        // We only need the state and props for the functions we have
        // We'll never to re-render, because we always render the same thing
        return false
    }

    render() {
        return <Importer
            title="Import Environments"
            importClassName="puppet-importer"
            createElement={this.createElement}
            readFile={this.readFile}
            import={this.import}
            onOpen={this.resetImporter} />
    }
}

function mapStateToProps(state) {
    return {
        assets: state.project.assets,
        project: state.project.project,
        assetsPath: state.project.settings.assetsPath,
        charactersPath: state.project.settings.charactersPath,
        self: state.self,
        nick: state.project.settings.nickname,
        numCharacters: state.project.numCharacters,
        defaults: state.defaults
    }
}

export default connect(mapStateToProps)(EnvironmentImporter)
