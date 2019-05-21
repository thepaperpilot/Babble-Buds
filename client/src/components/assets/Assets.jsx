import React, {Component} from 'react'
import ReactDOM from 'react-dom'
import { connect } from 'react-redux'
import Scrollbar from 'react-custom-scroll'
import * as JsSearch from 'js-search'
import { FixedSizeList as List } from 'react-window'
import DraggableAsset from './DraggableAsset'
import Folder from './Folder'
import AssetImporter from './AssetImporter'
import AssetContextMenu from './AssetContextMenu'
import FolderContextMenu from './FolderContextMenu'
import FolderList from './FolderList'
import './assets.css'
import './../ui/scrollbar.css'

class CustomScrollbarsVirtualList extends Component {
    constructor(props) {
        super(props)

        this.state = {
            scrollTo: undefined
        }

        this.onScroll = this.onScroll.bind(this)
        this.scrollTo = this.scrollTo.bind(this)
    }

    onScroll(event) {
        this.setState({
            scrollTo: undefined
        })
        this.props.onScroll(event)
    }

    scrollTo(scrollTo) {
        this.setState({ scrollTo })
    }

    render() {
        return <Scrollbar
            onScroll={this.onScroll}
            scrollTo={this.state.scrollTo}
            allowOuterScroll={true}
            heightRelativeToParent="100%" >
            <div style={{ position: 'relative' }} >
                {this.props.children}
            </div>
        </Scrollbar>
    }
}

class Assets extends Component {
    constructor(props) {
        super(props)

        this.componentWillReceiveProps(props)

        this.state = {
            size: props.size,
            filter: ''
        }

        this.scrollbar = React.createRef()
        this.list = React.createRef()

        this.onChange = this.onChange.bind(this)
        this.changeZoom = this.changeZoom.bind(this)
        this.handleScroll = this.handleScroll.bind(this)
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

    render() {
        // Apply our filter to our list of assets
        const filteredAssets = this.state.filter === '' ? Object.keys(this.props.assets) :
            Object.keys(this.props.assets).filter(id =>
                this.props.assets[id].name.toLowerCase().includes(this.state.filter.toLowerCase()))
        
        // Calculate how many will be shown in each row
        let assetsPerRow = Math.floor((this.props.rect.width * .75 - 14) / (this.state.size + 16))
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
            tabToRow[tab] = total
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
                    <FolderList tabs={tabs} tabToRow={tabToRow} jumpToFolder={this.jumpToFolder} />
                    <List
                        height={Math.max(this.props.rect.height, 0)}
                        width="75%"
                        itemCount={numAssets}
                        itemSize={size}
                        outerElementType={CustomScrollbarsVirtualList}
                        outerRef={this.scrollbar}
                        ref={this.list} >
                        {({ index, style }) => {
                            if (Object.values(tabToRow).includes(index)) {
                                const tab = Object.keys(tabToRow).find(tab => tabToRow[tab] === index)
                                return <div style={{...style, 'fontSize': size === 20 ? 15 : size / 3}}>
                                    <Folder tab={tab} />
                                </div>
                            } else {
                                const nextTabIndex = tabs.findIndex(tab => tabToRow[tab] >= index) - 1
                                const tab = tabs[nextTabIndex === -2 ? tabs.length - 1 : nextTabIndex]
                                const start = assetsPerRow * (index - tabToRow[tab] - 1)
                                const end = Math.min(assetsPerRow * (index - tabToRow[tab]), assetsByTab[tab].length)

                                return <div className={`list${size === 20 ? ' small' : ''}`} style={style}>
                                    {Array(end - start).fill(start).map((x, y) => x + y).map(i => {
                                        const id = assetsByTab[tab][i]
                                        return <div key={i} className="list-item" style={{width: size === 20 ? '100%' : size - 30, height: size - 30}}>
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
