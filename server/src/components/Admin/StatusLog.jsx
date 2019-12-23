import React, { Component } from 'react'
import Scrollbar from 'react-custom-scroll'
import * as JsSearch from 'js-search'
import Section from '../Containers/Section.jsx'

export default class StatusLog extends Component {
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

    createFilterToggle(filter) {
        return (
            <div className="toggle" style={{ backgroundColor: this.state[filter] ? 'var(--highlight)' : 'var(--background)'}} onClick={this.toggleFilter(filter)}>
                {filter}
            </div>
        )
    }

    componentWillReceiveProps(props) {
        if (!props.statusLog) return

        this.search = new JsSearch.Search('index')
        this.search.indexStrategy = new JsSearch.AllSubstringsIndexStrategy()
        this.search.searchIndex = new JsSearch.UnorderedSearchIndex()

        this.search.addIndex('level')
        this.search.addIndex('message')
        this.search.addDocuments(props.statusLog.map((status, i) => Object.assign({}, status, { index: i })))
    }

    render() {
        let statuses = (this.state.filter === '' ?
            this.props.statusLog :
            this.search.search(this.state.filter)
        )
        if (!this.state.info)
            statuses = statuses.filter(status => status.level !== 'info')
        if (!this.state.log)
            statuses = statuses.filter(status => status.level !== 'log')
        if (!this.state.warn)
            statuses = statuses.filter(status => status.level !== 'warn')
        if (!this.state.error)
            statuses = statuses.filter(status => status.level !== 'error')

        if (this.props.selectedRoom)
            statuses = statuses.filter(status => status.room === this.props.selectedRoom)

        return <Section title="Status Log">
            <div className="full-section bar">
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
            </div>
            
            <div className="full-section console">
                <Scrollbar allowOuterScroll={true} heightRelativeToParent="100%" 
                    keepAtBottom={true}>
                    {statuses.map((status, i) => (
                        <pre key={i} className={status.level}>
                            {status.data && status.data.location ?
                                <div className="thumbnail"><img src={`/${status.data.location}`} /></div> : null}
                            {status.data && status.data.thumbnail ?
                                <div className="thumbnail"><div style={{ backgroundImage: status.data.thumbnail }}></div></div> : null}
                            <span>{status.message}</span>
                            {status.data ? <div className="flex-spacer"></div> : null}
                            {status.data ? <button className="data" onClick={() => console.log(status.data)}>📝</button> : null}
                        </pre>
                    ))}
                </Scrollbar>
            </div>
        </Section>
    }
}
