import React, {Component} from 'react'
import { connect } from 'react-redux'
import Scrollbar from 'react-custom-scroll'
import Checkbox from '../inspector/fields/Checkbox'
import Modal from '../ui/Modal'
import List from '../ui/List'
import Foldable from '../ui/Foldable'
import './importer.css'

import { getNewAssetID } from './../../reducers/project/assets'
import { loadAssets } from './../../reducers/project/loader'

const fs = window.require('fs-extra')
const path = require('path')
const remote = window.require('electron').remote

class AssetImporter extends Component {
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
        this.importAssets = this.importAssets.bind(this)
    }

    async import() {
        const assetsPath = path.join(this.props.project, this.props.assetsPath)
        const selected = this.state.duplicate ? this.state.selected :
            this.state.selected.filter(id => !this.props.assets.includes(id))
            
        await Promise.all(selected.map(async id => {
            await fs.copy(path.join(this.state.assetsPath, this.state.assets[id].location),
                path.join(assetsPath, this.state.assets[id].location))
            if (this.state.assets[id].thumbnail)
                await fs.copy(path.join(this.state.assetsPath, this.state.assets[id].thumbnail),
                    path.join(assetsPath, this.state.assets[id].thumbnail))
        }))
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

        this.props.dispatch({
            type: 'ADD_ASSETS',
            assets
        })
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
                else
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

    // TODO do in hidden browserWindow so you don't block UI thread
    async importAssets() {
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
        }, async filepaths => {
            if (!filepaths) return
            const project = await fs.readJson(filepaths[0])
            const assetsPath = path.join(filepaths[0],
                project.assetsPath || '../assets')
            const assets = loadAssets(project, assetsPath, [])

            const tabs = Object.values(assets).reduce((acc, curr) =>
                acc.includes(curr.tab) ? acc : acc.concat(curr.tab), [])

            this.setState({
                project: filepaths[0],
                open: true,
                selected: [],
                assets,
                assetsPath,
                tabs
            })
        })
    }

    render() {
        let allSelected = Object.keys(this.state.assets).sort().join(',') ===
            this.state.selected.sort().join(',')

        const tabs = this.state.tabs.map(tab => {
            let assets = Object.keys(this.state.assets)
                .filter(id => this.state.assets[id].tab === tab)
            const allSelected = assets.every(a =>
                this.state.selected.includes(a))
            assets = assets.map(id => {
                const asset = this.state.assets[id]
                const selected = this.state.selected.includes(id)
                return <div key={id}
                    onClick={this.toggleAsset(id)}
                    className={selected ? 'char selected' : 'char'}>
                    {this.state.size === 60 ?
                        <div className="smallThumbnail-img">
                            <img
                                alt={asset.name}
                                src={`file:///${path.join(this.state.assetsPath,
                                    asset.type === 'animated' ?
                                        asset.thumbnail :
                                        asset.location)}`}
                                style={{width: '20px', height: '20px'}} />
                            {asset.name}
                        </div> :
                        <div>
                            <div className="desc">{asset.name}</div>
                            <img
                                alt={asset.name}
                                src={`file:///${path.join(this.state.assetsPath,
                                    asset.type === 'animated' ?
                                        asset.thumbnail :
                                        asset.location)}`} />
                        </div>}
                </div>
            })

            return assets.length ? <Foldable
                key={tab}
                title={<div className="flex-row">
                    {tab}
                    <div className="flex-grow" />
                    <Checkbox
                        inline={true}
                        value={allSelected}
                        onChange={this.toggleTab(tab, allSelected)}/>
                </div>}
                defaultFolded={true}>
                {this.state.size === 60 ? assets :
                    <List
                        scrollbar={false}
                        width={`${this.state.size}px`}
                        height={`${this.state.size}px`}>
                        {assets}
                    </List>}
            </Foldable> : null
        })

        // TODO tooltip on duplicate assets checkbox explaining what it does
        return <div>
            <button onClick={this.importAssets}>Import</button>
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
                <div className="flex-row bar">
                    <input
                        type="range"
                        min="60"
                        max="140"
                        value={this.state.size}
                        step="20"
                        onChange={this.changeZoom} />
                </div>
                <Scrollbar allowOuterScroll={true} heightRelativeToParent="calc(100% - 64px)">
                    <div className="importer">
                        {tabs}
                    </div>
                </Scrollbar>
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
