import React, {Component} from 'react'
import { connect } from 'react-redux'
import Scrollbar from 'react-custom-scroll'
import * as JsSearch from 'js-search'
import { FixedSizeList as List } from 'react-window'
import DraggableAsset from './DraggableAsset'
import Folder from './Folder'
import AssetImporter from './AssetImporter'
import AssetContextMenu from './AssetContextMenu'
import FolderContextMenu from './FolderContextMenu'
import './assets.css'
import './../ui/scrollbar.css'

const CustomScrollbarsVirtualList = ({ children, onScroll, ...props }) => {
    console.log(props, children, onScroll)
    const scroll = (...props) => {
        console.log(...props)
        onScroll(...props)
    }
    return <Scrollbar onScroll={scroll} allowOuterScroll={true} heightRelativeToParent="100%">
        <div style={{ position: 'relative' }} >
            {children}
        </div>
    </Scrollbar>
}

class Assets extends Component {
    constructor(props) {
        super(props)

        this.componentWillReceiveProps(props)

        this.state = {
            size: props.size,
            filter: ''
        }

        this.list = React.createRef()

        this.onChange = this.onChange.bind(this)
        this.changeZoom = this.changeZoom.bind(this)
        this.handleScroll = this.handleScroll.bind(this)
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

    onChange(e) {
        this.setState({
            filter: e.target.value
        })
    }

    changeZoom(e) {
        this.props.onZoomChange(parseInt(e.target.value, 10))
        this.setState({
            size: parseInt(e.target.value, 10)
        })
    }

    handleScroll({ target }) {
        const { scrollTop } = target

        this.list.current.scrollTo(scrollTop)
    }

    render() {
        if (this.list.current) {
            console.log(this.list.current.state.scrollOffset)
            this.list.current.scrollTo(this.list.current.state.scrollOffset)
            //offset = this.list.current.state.scrollOffset
        } else console.log("!")

        // Apply our filter to our list of assets
        const filteredAssets = this.state.filter === '' ? Object.keys(this.props.assets) :
            Object.keys(this.props.assets).filter(id =>
                this.props.assets[id].name.toLowerCase().includes(this.state.filter.toLowerCase()))
        
        // Calculate how many will be shown in each row
        let assetsPerRow = Math.floor((this.props.rect.width - 14) / (this.state.size + 16))
        if (assetsPerRow < 1) assetsPerRow = 1
        if (this.state.size === 60) assetsPerRow = 1

        // Calculate how many assets we'll have in each tab, and on which row each tab starts
        const tabs = Object.values(this.props.assets).reduce((acc, curr) =>
            acc.includes(curr.tab) ? acc : acc.concat(curr.tab), [])
        const tabToRow = {}
        const assetsByTab = tabs.reduce((acc, curr) => {
            acc[curr] = filteredAssets.filter(id => this.props.assets[id].tab === curr)
            return acc
        }, {})
        const numAssets = tabs.slice().reduce((total, tab) => {
            const numAssets = assetsByTab[tab].length
            if (numAssets === 0) {
                tabs.splice(tabs.indexOf(tab), 1)
                return total
            }
            tabToRow[tab] = total + 1
            // We add one for the header row
            return total + Math.ceil(numAssets / assetsPerRow) + 1
        }, 0)

        const size = this.state.size === 60 ? 20 : this.state.size + 30

        return (
            <div className="panel console assets">
                <div className="flex-row bar">
                    <AssetImporter />
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
                    <List
                        height={Math.max(this.props.rect.height, 0)}
                        width="100%"
                        itemCount={numAssets}
                        itemSize={size}
                        outerElementType={CustomScrollbarsVirtualList}
                        ref={this.list} >
                        {({ index, style }) => {
                            if (Object.values(tabToRow).includes(index + 1)) {
                                const tab = Object.keys(tabToRow).find(tab => tabToRow[tab] === index + 1)
                                return <div style={{...style, 'fontSize': size === 20 ? 15 : size / 3}}>
                                    <Folder tab={tab} />
                                </div>
                            } else {
                                const nextTabIndex = tabs.findIndex(tab => tabToRow[tab] > index) - 1
                                const tab = tabs[nextTabIndex === -2 ? tabs.length - 1 : nextTabIndex]
                                const start = assetsPerRow * (index - tabToRow[tab])
                                const end = Math.min(assetsPerRow * (index - tabToRow[tab] + 1), assetsByTab[tab].length)

                                return <div className={`list${size === 20 ? ' small' : ''}`} style={style}>
                                    {Array(end - start).fill(start).map((x, y) => x + y).map(i => {
                                        const id = assetsByTab[tab][i]
                                        return <div className="list-item" style={{width: size === 20 ? '100%' : size - 30, height: size - 30}}>
                                            <DraggableAsset
                                                key={id}
                                                id={id}
                                                asset={this.props.assets[id]}
                                                small={size === 20} />
                                        </div>
                                    })}
                                    {new Array(assetsPerRow - (end - start)).fill(0).map((child, i) => (
                                        <div className="list-pad" key={`${i}-pad`} style={{width: size - 30}}></div>
                                    ))}
                                </div>
                            }
                        }}
                    </List>
                </div>
                <AssetContextMenu tabs={tabs} />
                <FolderContextMenu />
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        assets: state.project.assets
    }
}

export default connect(mapStateToProps)(Assets)
