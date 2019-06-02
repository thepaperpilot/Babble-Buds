import React, {Component} from 'react'
import { connect } from 'react-redux'
import Scrollbar from 'react-custom-scroll'
import * as JsSearch from 'js-search'
import List from './../ui/List'
import DraggablePuppet from './DraggablePuppet'
import PuppetImporter from './PuppetImporter'
import PuppetContextMenu from './PuppetContextMenu'

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
        const puppets = (this.state.filter === '' ?
            Object.keys(this.props.puppets) :
            this.search.search(this.state.filter).map(puppet => puppet.id)
        )
        return (
            <div className="panel puppet-selector">
                <div className="bar flex-row">
                    <button onClick={this.newPuppet}>New Puppet</button>
                    <PuppetImporter />
                    <input
                        type="range"
                        min="60"
                        max="200"
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
                {this.state.size === 60 ?
                    <div className="full-panel">
                        <Scrollbar allowOuterScroll={true} heightRelativeToParent="100%">
                            {puppets.map(puppet => (
                                <DraggablePuppet
                                    key={puppet}
                                    small={true}
                                    puppet={puppet} />
                            ))}
                        </Scrollbar>
                    </div> :
                    <List width={`${this.state.size}px`} height={`${this.state.size}px`}>
                        {puppets.map(puppet => (
                            <DraggablePuppet
                                key={puppet}
                                small={false}
                                puppet={puppet} />
                        ))}
                    </List>
                }
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
