import React, {Component} from 'react'
import { connect } from 'react-redux'
import Checkbox from '../inspector/fields/Checkbox'
import Assets from './Assets'
import Modal from '../ui/Modal'
import { warn, inProgress } from '../../redux/status'
import './importer.css'

import { getNewAssetID } from '../../redux/project/assets/reducers'
import { loadAssets } from '../../redux/project/loader'

const fs = window.require('fs-extra')
const path = require('path')
const {remote, ipcRenderer} = window.require('electron')

class AssetImporter extends Component {
    static id = 0

    constructor(props) {
        super(props)

        this.state = {
            open: false,
            assets: [],
            tabs: [],
            selected: [],
            size: 80,
            duplicate: true
        }

        this.import = this.import.bind(this)
        this.changeZoom = this.changeZoom.bind(this)
        this.cancel = this.cancel.bind(this)
        this.toggleDupplicate = this.toggleDupplicate.bind(this)
        this.toggleAll = this.toggleAll.bind(this)
        this.toggleTab = this.toggleTab.bind(this)
        this.toggleAsset = this.toggleAsset.bind(this)
        this.selectProject = this.selectProject.bind(this)
    }

    import() {
        const assetsPath = path.join(this.props.project, this.props.assetsPath)
        const selected = this.state.duplicate ? this.state.selected :
            this.state.selected.filter(id => !this.props.assets.includes(id))
        const statusId = `import-${AssetImporter.id++}`

        const assets = selected.reduce((acc, curr) => {
            const id = this.state.duplicate ?
                `${this.props.self}:${getNewAssetID()}` : curr
            if (id in acc) return acc
            acc[id] = this.state.assets[curr]
            return acc
        }, {})

        this.setState({
            open: false
        })

        this.props.dispatch(inProgress(statusId, selected.length, 'Importing assets...'))

        ipcRenderer.send('background', 'import',
            this.state.duplicate,
            assets,
            this.state.assetsPath,
            assetsPath,
            statusId
        )
    }

    changeZoom(e) {
        this.setState({
            size: parseInt(e.target.value, 10)
        })
    }

    cancel() {
        this.setState({
            open: false
        })
    }

    toggleDupplicate() {
        this.setState({ duplicate: !this.state.duplicate })
    }

    toggleAll(allSelected) {
        return () => {
            this.setState({
                selected: allSelected ? [] : Object.keys(this.state.assets)
            })
        }
    }

    toggleTab(tab, allSelected) {
        return () => {
            const selected = this.state.selected.slice()
            Object.keys(this.state.assets).filter(id =>
                this.state.assets[id].tab === tab
            ).forEach(id => {
                if (allSelected)
                    selected.splice(selected.indexOf(id), 1)
                else if (!selected.includes(id))
                    selected.push(id)
            })
            this.setState({ selected })
        }
    }

    toggleAsset(id) {
        return () => {
            const selected = this.state.selected.slice()
            if (this.state.selected.includes(id)) {
                selected.splice(selected.indexOf(id), 1)
            } else {
                selected.push(id)
            }
            this.setState({ selected })
        }
    }

    selectProject() {
        remote.dialog.showOpenDialog(remote.BrowserWindow.getFocusedWindow(), {
            title: 'Select Project',
            defaultPath: path.join(remote.app.getPath('home'), 'projects'),
            filters: [
                {name: 'Babble Buds Project File', extensions: ['babble']},
                {name: 'All Files', extensions: ['*']}
            ],
            properties: [
                'openFile'
            ] 
        }, filepaths => {
            if (!filepaths) return
            const project = fs.readJsonSync(filepaths[0])
            filepaths[0] = filepaths[0].replace(/\\/g, '/')
            
            const assetsPath = path.join(filepaths[0],
                project.assetsPath || '../assets')
            const {assets, folders, error, errors} = loadAssets(project, assetsPath, [])
            if (error)
                this.props.dispatch(warn(error))
            if (errors)
                errors.forEach(e => this.props.dispatch(warn(e)))

            this.setState({
                project: filepaths[0],
                open: true,
                selected: [],
                assets,
                assetsPath,
                tabs: folders
            })
        })
    }

    render() {
        let allSelected = Object.keys(this.state.assets).sort().join(',') ===
            this.state.selected.sort().join(',')

        const CustomAsset = ({asset, id, small}) => <div
            onClick={this.toggleAsset(id)}
            className={this.state.selected.includes(id) ? 'char selected' : 'char'}>
            {small && <div className="line-item smallThumbnail-wrapper">
                <div className="smallThumbnail-img"
                    style={{width: '20px', height: '20px'}}>
                    <img
                        alt={asset.name}
                        src={`file:///${path.join(this.state.assetsPath,
                            asset.type === 'animated' ?
                                asset.thumbnail :
                                asset.location)}`}
                        style={{width: '20px', height: '20px'}} />
                </div>
                <div className="inner-line-item">{asset.name}</div>
            </div>}
            {small || <img
                alt={asset.name}
                src={`file:///${path.join(this.state.assetsPath,
                    asset.type === 'animated' ?
                        asset.thumbnail :
                        asset.location)}`} />}
            {small || <div className="desc">{asset.name}</div>}
        </div>

        const CustomFolder = ({tab, row, jumpToFolder}) => {
            const allSelected = Object.keys(this.state.assets)
                .filter(id => this.state.assets[id].tab === tab)
                .every(a => this.state.selected.includes(a))
            return <div className="folder-list-item">
                <div
                    className="header-wrapper"
                    onClick={() => jumpToFolder(row)}>
                    <div className="inner-line-item">{tab}</div>
                    <div className={allSelected ?
                        'toggle-button selected' :
                        'toggle-button'}
                    onClick={this.toggleTab(tab, allSelected)}>
                        toggle
                    </div>
                </div>
            </div>
        }

        const CustomTitle = ({tab}) => <div className="header-wrapper">
            <div className="inner-line-item">{tab}</div>
        </div>

        // TODO tooltip on duplicate assets checkbox explaining what it does
        return <div>
            <button onClick={this.selectProject}>Import</button>
            <Modal
                title={`Import Assets - ${path.basename(this.state.project)}`}
                open={this.state.open}
                onClose={this.cancel}
                style={{ height: '80%' }}
                footer={[
                    <Checkbox
                        inline={true}
                        title="Toggle All"
                        key="1"
                        value={allSelected}
                        onChange={this.toggleAll(allSelected)}/>,
                    <Checkbox
                        inline={true}
                        title="Duplicate Assets"
                        key="2"
                        value={this.state.duplicate}
                        onChange={this.toggleDupplicate}/>,
                    <div className="flex-grow" key="3"/>,
                    <button onClick={this.import} key="4">Import</button>]}>
                <div className="asset-importer">
                    <Assets
                        isAssetImporter={true}
                        assets={this.state.assets}
                        folders={this.state.tabs}
                        selected={this.state.selected}
                        rect={{
                            width: Math.min(900, .9 * window.innerWidth),
                            // Magic number alert: height of the footer and bar
                            height: Math.min(1000, .8 * window.innerHeight) - 67
                        }}
                        CustomAsset={CustomAsset}
                        CustomFolder={CustomFolder}
                        CustomTitle={CustomTitle} />
                </div>
            </Modal>
        </div>
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
