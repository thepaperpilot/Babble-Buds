import React, {Component} from 'react'
import { connect } from 'react-redux'
import Scrollbar from 'react-custom-scroll'
import * as JsSearch from 'js-search'
import Foldable from './../ui/Foldable'
import List from './../ui/List'
import DraggableAsset from './DraggableAsset'
import Folder from './Folder'
import AssetImporter from './AssetImporter'
import './assets.css'

class Assets extends Component {
    constructor(props) {
        super(props)

        this.componentWillReceiveProps(props)

        this.state = {
            size: props.size,
            filter: '',
            tabs: this.calculateTabs(props)
        }

        // Array to hold our refs
        this.tabs = []

        this.onChange = this.onChange.bind(this)
        this.changeZoom = this.changeZoom.bind(this)
        this.calculateTabs = this.calculateTabs.bind(this)
        this.newAssetTab = this.newAssetTab.bind(this)
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

        if (this.state) {
            this.setState({
                tabs: this.calculateTabs(props)
            })
        }
    }

    componentDidUpdate() {        
        if (this.toFocus) {
            const folder = this.tabs[this.toFocus].current
            if (folder) folder.focus()
            this.toFocus = null
        }
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

    calculateTabs(props) {
        const tabs = Object.values(props.assets).reduce((acc, curr) =>
            acc.includes(curr.tab) ? acc : acc.concat(curr.tab), [])
        this.tabs = tabs.reduce((acc, curr) => {
            acc[curr] = React.createRef()
            return acc
        }, {})
        return tabs
    }

    newAssetTab(id) {
        return () => {
            let name = 'New Asset Folder', i = 2
            while (this.state.tabs.includes(name))
                name = `New Asset Folder (${i})`

            this.toFocus = name
            this.props.dispatch({
                type: 'MOVE_ASSET',
                asset: id,
                tab: name
            })
        }
    }

    render() {
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
                <div className="full-panel">
                    <Scrollbar allowOuterScroll={true} heightRelativeToParent="100%">
                        {this.state.tabs.map(tab => {
                            const assets = Object.keys(this.props.assets).filter(id => {
                                const asset = this.props.assets[id]
                                return asset.tab === tab &&
                                (this.state.filter === '' || asset.name.toLowerCase()
                                    .includes(this.state.filter.toLowerCase()))
                            }).map(id => 
                                <DraggableAsset
                                    key={id}
                                    id={id}
                                    newAssetTab={this.newAssetTab(id)}
                                    asset={this.props.assets[id]}
                                    tabs={this.state.tabs}
                                    small={this.state.size === 60} />
                            )
                            return assets.length ? <Foldable
                                key={tab}
                                title={<Folder
                                    ref={this.tabs[tab]}
                                    name={tab} />}
                                defaultFolded={true}>
                                {this.state.size === 60 ? assets :
                                    <List
                                        scrollbar={false}
                                        width={`${this.state.size}px`}
                                        height={`${this.state.size}px`}>
                                        {assets}
                                    </List>}
                            </Foldable> : null
                        })}
                    </Scrollbar>
                </div>
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
