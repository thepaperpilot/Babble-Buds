import React, {Component} from 'react'
import { connect } from 'react-redux'
import Checkbox from '../inspector/fields/Checkbox'
import Assets from './Assets'
import { warn, inProgress } from '../../redux/status'
import Importer from '../ui/Importer'

import './importer.css'

import { getNewAssetID } from '../../redux/project/assets/reducers'
import { loadAssets } from '../../redux/project/loader'

const fs = window.require('fs-extra')
const path = require('path')
const ipcRenderer = window.require('electron').ipcRenderer

export const TYPE_MAP = {
    json: 'particles',
    gif: 'animated',
    png: 'sprite'
}

class AssetImporter extends Component {
    static id = 0

    constructor(props) {
        super(props)

        this.state = {
            assets: {},
            folders: [],
            assetsPaths: {},
            duplicate: false
        }

        this.toggleDuplicate = this.toggleDuplicate.bind(this)
        this.createElements = this.createElements.bind(this)
        this.resetImporter = this.resetImporter.bind(this)
        this.readImage = this.readImage.bind(this)
        this.readProject = this.readProject.bind(this)
        this.readFile = this.readFile.bind(this)
        this.import = this.import.bind(this)
    }

    toggleDuplicate() {
        this.setState({ duplicate: !this.state.duplicate })
    }

    createElements({ items, selected, toggleItem }) {
        const CustomAsset = ({asset, id, small}) => {
            const filepath = Object.keys(this.state.assetsPaths).find(filepath =>
                this.state.assetsPaths[filepath].assets.includes(id))
            const assetsPath = this.state.assetsPaths[filepath].assetsPath
            return <div
                onClick={toggleItem(id)}
                className={selected.includes(id) ? 'char selected' : 'char'}>
                {small && <div className="line-item smallThumbnail-wrapper">
                    <div className="smallThumbnail-img"
                        style={{width: '20px', height: '20px'}}>
                        <img
                            alt={asset.name}
                            src={`file:///${path.join(assetsPath,
                                asset.type === 'animated' ?
                                    asset.thumbnail :
                                    asset.location)}`}
                            style={{width: '20px', height: '20px'}} />
                    </div>
                    <div className="inner-line-item">{asset.name}</div>
                </div>}
                {small || <img
                    alt={asset.name}
                    src={`file:///${path.join(assetsPath,
                        asset.type === 'animated' ?
                            asset.thumbnail :
                            asset.location)}`} />}
                {small || <div className="desc">{asset.name}</div>}
            </div>
        }

        const CustomFolder = ({tab, row, jumpToFolder}) => {
            const assets = Object.keys(items).filter(id => items[id].tab === tab)
            const allSelected = assets.every(a => selected.includes(a))
            return <div className="folder-list-item">
                <div
                    className="header-wrapper"
                    onClick={() => jumpToFolder(row)}>
                    <div className="inner-line-item">{tab}</div>
                    <div className={allSelected ?
                        'toggle-button selected' :
                        'toggle-button'}
                    onClick={toggleItem(...assets.filter(id => allSelected === selected.includes(id)))}></div>
                </div>
            </div>
        }

        const CustomTitle = ({tab}) => <div className="header-wrapper">
            <div className="inner-line-item">{tab}</div>
        </div>

        return <div className="asset-importer">
            <Assets
                isAssetImporter={true}
                assets={items}
                folders={this.state.folders}
                selected={selected}
                rect={{
                    width: Math.min(900, .9 * window.innerWidth),
                    // Magic number alert: height of the footer and bar
                    height: Math.min(1000, .8 * window.innerHeight) - 67
                }}
                CustomAsset={CustomAsset}
                CustomFolder={CustomFolder}
                CustomTitle={CustomTitle} />
        </div>
    }

    resetImporter() {
        this.setState({
            assets: {},
            folders: [],
            assetsPath: {},
            duplicate: false
        })
    }

    readProject(filepath) {
        const project = fs.readJsonSync(filepath)
        const assetsPath = path.join(filepath, project.assetsPath || '../assets')
        const { assets, folders, error, errors } = loadAssets(project, assetsPath, [])
        if (error)
            this.props.dispatch(warn(error))
        if (errors)
            errors.forEach(e => this.props.dispatch(warn(e)))

        this.setState({
            assets: {...this.state.assets, ...assets},
            folders: [...new Set([...this.state.folders, ...folders])],
            assetsPaths: {
                ...this.state.assetsPaths,
                [filepath]: {
                    assetsPath,
                    assets: Object.keys(assets)
                }
            }
        })

        return assets
    }

    readImage(filepath, fileType) {
        const assetId = getNewAssetID()
        const id = `${this.props.self}:${assetId}`
        const assetsPath = ''
        const asset = {
            name: path.basename(filepath, fileType),
            type: TYPE_MAP[fileType],
            tab: 'unsorted',
            location: fileType === 'json' ? null : filepath,
            thumbnail: fileType === 'json' ? 'temp' : null,
            version: 0,
            panning: []
        }

        this.setState({
            assets: { ...this.state.assets, [id]: asset },
            folders: [...new Set([...this.state.folders, 'unsorted'])],
            assetsPaths: {
                ...this.state.assetsPaths,
                [filepath]: {
                    assetsPath,
                    assets: [ id ]
                }
            }
        })

        return {
            [id]: asset
        }
    }

    readFile(filepath) {
        switch (path.extname(filepath)) {
            case '.png':
            case '.gif':
            case '.json':
                return this.readImage(filepath, path.extname(filepath).slice(1))
            default: case '.babble':
                return this.readProject(filepath)
        }
    }

    import(filepath, items) {
        const statusId = `import-${AssetImporter.id++}`

        const assets = Object.keys(items).reduce((acc, curr) => {
            const id = this.state.duplicate ? `${this.props.self}:${getNewAssetID()}` : curr
            if (id in acc) return acc
            acc[id] = this.state.assets[curr]
            return acc
        }, {})

        // Create status message for showing progress on importing assets
        this.props.dispatch(inProgress(statusId, Object.keys(items).length, 'Importing assets...'))

        // Make the background window copy all the necessary files over
        ipcRenderer.send('background', 'import',
            this.state.duplicate,
            // Assets to add
            assets,
            // Assets path to copy assets from
            this.state.assetsPaths[filepath].assetsPath,
            // Assets path to move assets to
            path.join(this.props.project, this.props.assetsPath),
            // ID for sending status updates as new assets get added
            statusId
        )
    }

    shouldComponentUpdate(nextProps, nextState) {
        return this.state.duplicate !== nextState.duplicate
    }

    render() {
        return <Importer
            title="Import Assets"
            createElements={this.createElements}
            readFile={this.readFile}
            import={this.import}
            onOpen={this.resetImporter}
            filters={[
                {name: 'Image', extensions: ['png']},
                {name: 'Animated Image', extensions: ['gif']},
                {name: 'Particle Effect', extensions: ['json']}]}
            footers={[<Checkbox
                inline={true}
                title="Duplicate Assets"
                key="2.5"
                value={this.state.duplicate}
                onChange={this.toggleDuplicate}/>]} />
    }
}

function mapStateToProps(state) {
    return {
        assets: Object.keys(state.project.assets),
        project: state.project.project,
        assetsPath: state.project.settings.assetsPath,
        self: state.self
    }
}

export default connect(mapStateToProps)(AssetImporter)
