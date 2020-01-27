import React, {Component, memo} from 'react'
import { connect } from 'react-redux'
import * as JsSearch from 'js-search'
import { FixedSizeList as List, areEqual } from 'react-window'
import DraggableAsset from './DraggableAsset'
import Folder from './Folder'
import AssetImporter from './AssetImporter'
import AssetContextMenu from './AssetContextMenu'
import FolderContextMenu from './FolderContextMenu'
import FolderList from './FolderList'
import CustomScrollbarsVirtualList from '../ui/CustomScrollbarsVirtualList'
import { getNewAssetID } from '../../redux/project/assets/reducers'
import { TYPE_MAP } from './AssetImporter'
import { inProgress } from '../../redux/status'
import './assets.css'
import '../ui/list.css'

const path = require('path')
const {remote, ipcRenderer} = window.require('electron')
const settingsManager = remote.require('./main-process/settings')

class Assets extends Component {
    static id = 0

    constructor(props) {
        super(props)

        this.componentWillReceiveProps(props)

        this.state = {
            size: props.size || 100,
            filter: ''
        }

        this.scrollbar = React.createRef()
        this.list = React.createRef()

        this.loadAssets = this.loadAssets.bind(this)
        this.onChange = this.onChange.bind(this)
        this.changeZoom = this.changeZoom.bind(this)
        this.jumpToFolder = this.jumpToFolder.bind(this)
    }

    componentWillReceiveProps(props) {
        if (!props.assets) return

        this.search = new JsSearch.Search('id')
        this.search.indexStrategy = new JsSearch.AllSubstringsIndexStrategy()
        this.search.searchIndex = new JsSearch.UnorderedSearchIndex()

        this.search.addIndex('name')
        this.search.addDocuments(Object.keys(props.assets).map(asset => ({
            id: asset,
            name: props.assets[asset].name 
        })))
    }

    loadAssets(assets, tab) {
        const statusId = `asset-${Assets.id++}`
        this.props.dispatch(inProgress(statusId, assets.length, 'Adding new assets...'))

        assets = assets.reduce((acc, curr) => {
            const fileType = path.extname(curr).slice(1)
            const name = path.basename(curr.replace(/^.*[\\/]/, ''), `.${fileType}`)
            const id = getNewAssetID()

            const asset = {
                type: TYPE_MAP[fileType],
                tab,
                name,
                version: 0,
                panning: [],
                location: fileType === 'json' ? null : path.join(settingsManager.settings.uuid, `${id}.png`),
                thumbnail: fileType === 'json' ? 'temp' : null,
                // The following is temporary for use by the background process
                // and will be deleted before being added to the assets lists
                filepath: curr
            }

            if (fileType === 'animated')
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

    onChange(e) {
        this.setState({
            filter: e.target.value
        })
    }

    changeZoom(e) {
        if (this.props.onZoomChange)
            this.props.onZoomChange(parseInt(e.target.value, 10))
        this.setState({
            size: parseInt(e.target.value, 10)
        })
    }

    jumpToFolder(tab) {
        // When you scroll to a specific item it tries setting scrollTop to my
        // custom scrollbar, which is actually a container that isn't tall enough
        // for it to allow scrollTop to actually be changed. So instead I define
        // a property that maps the setter to a function in my custom scrollbar
        // that'll scroll it to the appropriate location
        if (!this.scrollbar.current.hasOwnProperty('scrollTop'))
            Object.defineProperty(this.scrollbar.current, 'scrollTop', {
                get: () => 0,
                set: this.scrollbar.current.scrollTo
            })
        this.list.current.scrollToItem(tab, 'start')
    }

    // You can't click on an item in a react-window list the same frame its rendering,
    // and the panel would re-render whenever you changed focus to it, which would happen
    // when clicking one of the items. Basically, this line prevents it from
    // re-rendering when focus changes to this panel (since nothing's changed), thus
    // fixing a bug causing puppets to not get selected sometimes
    shouldComponentUpdate(newProps, newState) {
        return !(JSON.stringify(this.props) == JSON.stringify(newProps) && this.state == newState)
    }

    render() {
        // Apply our filter to our list of assets
        const filteredAssets = this.state.filter === '' ?
            Object.keys(this.props.assets) :
            Object.keys(this.props.assets).filter(id =>
                this.props.assets[id].name.toLowerCase()
                    .includes(this.state.filter.toLowerCase()))
        
        // Calculate how many will be shown in each row
        const width = this.props.rect.width * .75 - 14
        let assetsPerRow = Math.floor(width / (this.state.size + 16))
        if (assetsPerRow < 1) assetsPerRow = 1
        if (this.state.size === 60) assetsPerRow = 1

        // Calculate how many assets we'll have in each tab,
        // and on which row each tab starts
        const tabs = this.props.folders
        const tabToRow = {}
        const assetsByTab = tabs.reduce((acc, curr) => {
            acc[curr] = filteredAssets.filter(id => this.props.assets[id].tab === curr)
            acc[curr].sort((a, b) =>
                this.props.assets[a].name.localeCompare(this.props.assets[b].name))
            return acc
        }, {})
        const numAssets = tabs.slice().reduce((total, tab) => {
            const numAssets = assetsByTab[tab].length
            tabToRow[tab] = total
            // We add one for the header row
            return total + Math.ceil(numAssets / assetsPerRow) + 1
        }, 0)

        const size = this.state.size === 60 ? 20 : this.state.size + 30
        const {CustomAsset, CustomFolder, CustomTitle} = this.props

        const LinkedAssetContextMenu = AssetContextMenu(this.props.id)
        const LinkedFolderContextMenu = FolderContextMenu(this.props.id)

        return <div className="panel console assets">
            <div className="flex-row bar">
                {this.props.isAssetImporter || <AssetImporter rect={this.props.rect} />}
                <input
                    type="range"
                    min="60"
                    max="140"
                    value={this.state.size}
                    step="20"
                    onChange={this.changeZoom} />
                <div className="flex-grow" />
                <div className="search">
                    <input
                        type="search"
                        placeholder="All"
                        value={this.state.filter}
                        onChange={this.onChange} />
                </div>
            </div>
            <div className="full-panel" >
                <FolderList contextmenu={this.props.id}
                    CustomFolder={CustomFolder} tabs={tabs} tabToRow={tabToRow}
                    jumpToFolder={this.jumpToFolder}
                    loadAssets={this.loadAssets} />
                <List
                    height={Math.max(this.props.rect.height, 0)}
                    width="75%"
                    itemCount={numAssets}
                    itemSize={size}
                    outerElementType={CustomScrollbarsVirtualList}
                    outerRef={this.scrollbar}
                    ref={this.list} >
                    {memo(({ index, style }) => {
                        if (Object.values(tabToRow).includes(index)) {
                            const tab = Object.keys(tabToRow).find(tab =>
                                tabToRow[tab] === index)
                            return <div style={{...style,
                                'fontSize': size === 20 ? 15 : size / 3}}>
                                {CustomTitle ?
                                    <CustomTitle contextmenu={this.props.id} tab={tab} /> :
                                    <Folder contextmenu={this.props.id} tab={tab} loadAssets={this.loadAssets} />}
                            </div>
                        } else {
                            const nextTabIndex = tabs.findIndex(tab =>
                                tabToRow[tab] >= index) - 1
                            const tab = tabs[nextTabIndex === -2 ?
                                tabs.length - 1 :
                                nextTabIndex]
                            const start = assetsPerRow * (index - tabToRow[tab] - 1)
                            const theoreticalEnd = assetsPerRow * (index - tabToRow[tab])
                            const end = Math.min(theoreticalEnd, assetsByTab[tab].length)

                            return <div className={`list${size === 20 ? ' small' : ''}`} 
                                style={style}>
                                {Array(end - start).fill(start).map((x, y) => x + y)
                                    .map(i => {
                                        const id = assetsByTab[tab][i]
                                        const props = {
                                            key: id,
                                            id,
                                            contextmenu: this.props.id,
                                            asset: this.props.assets[id],
                                            small: size === 20
                                        }
                                        return <div key={i} className="list-item"
                                            style={{
                                                width: size === 20 ? '100%' : size - 30,
                                                height: size - 30}}>
                                            {CustomAsset ? <CustomAsset {...props} /> :
                                                <DraggableAsset {...props} />}
                                        </div>
                                    })}
                                {new Array(assetsPerRow - (end - start)).fill(0)
                                    .map((child, i) => (
                                        <div className="list-pad" key={`${i}-pad`}
                                            style={{width: size - 30}}>
                                        </div>
                                    ))}
                            </div>
                        }
                    }, areEqual)}
                </List>
            </div>
            {this.props.isAssetImporter || <LinkedAssetContextMenu tabs={tabs} />}
            {this.props.isAssetImporter || <LinkedFolderContextMenu loadAssets={this.loadAssets} />}
        </div>
    }
}

function mapStateToProps(state, props) {
    return {
        assets: props.assets || state.project.assets,
        folders: props.folders || state.project.folders,
        project: state.project.project,
        assetsPath: state.project.settings.assetsPath
    }
}

export default connect(mapStateToProps)(Assets)
