import React, {Component} from 'react'
import Scrollbar from 'react-custom-scroll'
import { connect } from 'react-redux'
import * as JsSearch from 'js-search'
import './console.css'

const remote = window.require('electron').remote

class Console extends Component {
    constructor(props) {
        super(props)

        this.componentWillReceiveProps(props)

        this.state = {
            filter: '',
            info: false,
            log: true,
            warn: true,
            error: true
        }

        this.onChange = this.onChange.bind(this)
        this.toggleFilter = this.toggleFilter.bind(this)
        this.createFilterToggle = this.createFilterToggle.bind(this)
    }

    onChange(e) {
        this.setState({
            filter: e.target.value
        })
    }

    toggleFilter(filter) {
        return () => {
            this.setState({
                [filter]: !this.state[filter]
            })
        }
    }

    toggleDevTools() {
        remote.getCurrentWindow().toggleDevTools()
    }

    createFilterToggle(filter) {
        return (
            <div className="toggle" style={{ backgroundColor: this.state[filter] ? '#333c4a' : '#242a33'}} onClick={this.toggleFilter(filter)}>
                {filter}
            </div>
        )
    }

    componentWillReceiveProps(props) {
        if (!props.status) return

        this.search = new JsSearch.Search('index')
        this.search.indexStrategy = new JsSearch.AllSubstringsIndexStrategy()
        this.search.searchIndex = new JsSearch.UnorderedSearchIndex()

        this.search.addIndex('type')
        this.search.addIndex('message')
        this.search.addIndex('error')
        this.search.addDocuments(props.status.map((status, i) => Object.assign({}, status, { index: i })))
    }

    render() {
        let statuses = (this.state.filter === '' ?
            this.props.status :
            this.search.search(this.state.filter)
        )
        if (!this.state.info)
            statuses = statuses.filter(status => status.type !== 'info')
        if (!this.state.log)
            statuses = statuses.filter(status => status.type !== 'log')
        if (!this.state.warn)
            statuses = statuses.filter(status => status.type !== 'warn')
        if (!this.state.error)
            statuses = statuses.filter(status => status.type !== 'error')

        return (
            <div className="panel console">
                <div className="bar flex-row">
                    {this.createFilterToggle('info')}
                    {this.createFilterToggle('log')}
                    {this.createFilterToggle('warn')}
                    {this.createFilterToggle('error')}
                    <div className="flex-spacer"></div>
                    <div className="search">
                        <input
                            type="search"
                            placeholder="All"
                            value={this.state.filter}
                            onChange={this.onChange} />
                    </div>
                    <div className="flex-spacer"></div>
                    <button onClick={this.toggleDevTools}>Toggle Dev Tools</button>
                </div>
                
                <div className="full-panel">
                    <Scrollbar allowOuterScroll={true} heightRelativeToParent="100%">
                        {statuses.map((status, i) => (
                            <pre key={i} className={status.type}>
                                {status.message}
                            </pre>
                        ))}
                    </Scrollbar>
                </div>
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        status: state.status
    }
}

export default connect(mapStateToProps)(Console)
