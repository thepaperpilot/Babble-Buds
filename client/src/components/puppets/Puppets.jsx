import React, {Component} from 'react'
import { connect } from 'react-redux'
import Scrollbar from 'react-custom-scroll'
import * as JsSearch from 'js-search'
import { FixedSizeList as List } from 'react-window'
import DraggablePuppet from './DraggablePuppet'
import PuppetImporter from './PuppetImporter'
import PuppetContextMenu from './PuppetContextMenu'
import CustomScrollbarsVirtualList from './../ui/CustomScrollbarsVirtualList'
import './puppets.css'
import './../ui/list.css'

class Puppets extends Component {
    constructor(props) {
        super(props)

        this.componentWillReceiveProps(props)

        this.state = {
            size: props.size,
            filter: ''
        }

        this.newPuppet = this.newPuppet.bind(this)
        this.onChange = this.onChange.bind(this)
        this.changeZoom = this.changeZoom.bind(this)
    }

    newPuppet() {
        this.props.dispatch({ type: 'NEW_PUPPET' })
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

    componentWillReceiveProps(props) {
        if (!props.puppets) return

        this.search = new JsSearch.Search('id')
        this.search.indexStrategy = new JsSearch.AllSubstringsIndexStrategy()
        this.search.searchIndex = new JsSearch.UnorderedSearchIndex()

        this.search.addIndex('name')
        this.search.addDocuments(Object.keys(props.puppets).map(puppet => ({ id: puppet, name: props.puppets[puppet].name })))
    }

    render() {
        const size = this.state.size
        const puppets = (this.state.filter === '' ?
            Object.keys(this.props.puppets) :
            this.search.search(this.state.filter).map(puppet => puppet.id)
        )

        // Calculate how many will be shown in each row
        let puppetsPerRow = Math.floor((this.props.rect.width - 14) / (size + 16))
        if (puppetsPerRow < 1) puppetsPerRow = 1
        if (size === 60) puppetsPerRow = 1

        const rows = Math.ceil(puppets.length / puppetsPerRow)

        return (
            <div className="panel puppet-selector">
                <div className="bar flex-row">
                    <button onClick={this.newPuppet}>New Puppet</button>
                    <PuppetImporter />
                    <input
                        type="range"
                        min="60"
                        max="200"
                        value={size}
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
                <List
                    height={Math.max(this.props.rect.height, 0)}
                    itemCount={rows}
                    itemSize={size === 60 ? 29 : 2 * size}
                    outerElementType={CustomScrollbarsVirtualList}>
                    {({ index, style }) => {
                        const start = puppetsPerRow * index
                        const length = Math.min(puppetsPerRow * (index + 1), puppets.length) - puppetsPerRow * index

                        return <div className={size === 60 ? '' : 'list'} style={style}>
                            {Array(length).fill(0).map((x, y) => x + y).map(i => {
                                return <div key={i} className={size === 60 ? '' : 'list-item'} style={{width: size === 60 ? '100%' : size - 30, height: 2 * size - 30}}>
                                    <DraggablePuppet 
                                        key={i}
                                        small={size === 60}
                                        puppet={puppets[start + i]} />
                                </div>
                            })}
                            {new Array(puppetsPerRow - length).fill(0).map((child, i) => (
                                <div className="list-pad" key={`${i}-pad`} style={{width: size - 30}}></div>
                            ))}
                        </div>
                    }}
                </List>
                <PuppetContextMenu />
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        puppets: state.project.characters
    }
}

export default connect(mapStateToProps)(Puppets)