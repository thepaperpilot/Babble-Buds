import React, {Component, memo} from 'react'
import { connect } from 'react-redux'
import * as JsSearch from 'js-search'
import { FixedSizeList as List, areEqual } from 'react-window'
import Environment from './Environment'
import EnvironmentImporter from './EnvironmentImporter'
import EnvironmentContextMenu from './EnvironmentContextMenu'
import CustomScrollbarsVirtualList from '../ui/CustomScrollbarsVirtualList'
import { newEnvironment } from '../../redux/project/environments/actions'

import './environments.css'
import '../ui/list.css'

class Environments extends Component {
    constructor(props) {
        super(props)

        this.componentWillReceiveProps(props)

        this.state = {
            size: props.size,
            filter: ''
        }

        this.newEnvironment = this.newEnvironment.bind(this)
        this.onChange = this.onChange.bind(this)
        this.changeZoom = this.changeZoom.bind(this)
    }

    newEnvironment() {
        this.props.dispatch(newEnvironment())
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
        if (!props.environments) return

        this.search = new JsSearch.Search('id')
        this.search.indexStrategy = new JsSearch.AllSubstringsIndexStrategy()
        this.search.searchIndex = new JsSearch.UnorderedSearchIndex()

        this.search.addIndex('name')
        this.search.addDocuments({id: -1, name: 'DEFAULT'})
        this.search.addDocuments(Object.keys(props.environments).map(env => ({ id:env, name: props.environments[env].name })))
    }

    shouldComponentUpdate(newProps, newState) {
        return !(JSON.stringify(this.props) == JSON.stringify(newProps) && this.state == newState)
    }

    render() {
        const size = this.state.size
        const environments = (this.state.filter === '' ?
            [-1, ...Object.keys(this.props.environments)] :
            this.search.search(this.state.filter).map(env => env.id)
        )
        environments.sort((a, b) =>
            b === -1 ? 1 : this.props.environments[a].name.localeCompare(this.props.environments[b].name))

        // Calculate how many will be shown in each row
        let environmentsPerRow = Math.floor((this.props.rect.width - 14) / size)
        if (environmentsPerRow < 1) environmentsPerRow = 1
        if (size === 60) environmentsPerRow = 1

        const rows = Math.ceil(environments.length / environmentsPerRow)

        const LinkedEnvironmentContextMenu = EnvironmentContextMenu(this.props.id)

        return (
            <div className="panel puppet-selector environment-selector">
                <div className="bar flex-row">
                    <button onClick={this.newEnvironment}>New Environment</button>
                    <EnvironmentImporter />
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
                    itemSize={size === 60 ? 29 : size}
                    outerElementType={CustomScrollbarsVirtualList}>
                    {memo(({ index, style }) => {
                        const start = environmentsPerRow * index
                        const length = Math.min(environmentsPerRow * (index + 1), environments.length) - environmentsPerRow * index

                        return <div className={size === 60 ? '' : 'list'} style={style}>
                            {Array(length).fill(0).map((x, y) => x + y).map(i => {
                                const id = environments[start + i]
                                return <div key={i} className={size === 60 ? '' : 'list-item'} style={{width: size === 60 ? '100%' : size - 18, height: size - 18}}>
                                    <Environment 
                                        key={i}
                                        small={size === 60}
                                        width={size - 18}
                                        height={size - 18}
                                        contextmenu={this.props.id}
                                        id={id}
                                        environment={id === -1 ? this.props.defaultEnvironment :
                                            this.props.environments[id]} />
                                </div>
                            })}
                            {new Array(environmentsPerRow - length).fill(0).map((child, i) => (
                                <div className="list-pad" key={`${i}-pad`} style={{width: size - 6}}></div>
                            ))}
                        </div>
                    }, areEqual)}
                </List>
                <LinkedEnvironmentContextMenu />
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        environments: state.project.environments,
        defaultEnvironment: state.defaults.environment
    }
}

export default connect(mapStateToProps)(Environments)
