import React, { Component } from 'react'
import Scrollbar from 'react-custom-scroll'
import * as JsSearch from 'js-search'
import Section from '../Containers/Section.jsx'

export default class RoomList extends Component {
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
        return <Section title="Active Rooms">
            <div className="full-section console roomList">
                <Scrollbar allowOuterScroll={true} heightRelativeToParent="100%" 
                    keepAtBottom={true}>
                    {Object.keys(this.props.rooms).map((name, i) => {
                        const room = this.props.rooms[name]
                        return <pre key={i} className={this.props.selectedRoom == name ? 'selected' : ''} onClick={this.props.selectRoom(name)}>
                            {name}
                            <span className="user-count">{Object.keys(room.users).length}</span>
                        </pre>
                    })}
                </Scrollbar>
            </div>
        </Section>
    }
}
