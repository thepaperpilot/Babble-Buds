import React, { Component } from 'react'
import { connect } from 'react-redux'
import Foldable from '../ui/Foldable'
import {
    addSharedPuppet as add, removeSharedPuppet as remove,
    setSharedPuppets
} from '../../redux/project/settings/networking'
import cx from 'classnames'

class SharedPuppets extends Component {
    constructor(props) {
        super(props)

        this.togglePuppet = this.togglePuppet.bind(this)
        this.togglePuppets = this.togglePuppets.bind(this)
    }

    togglePuppet(id, selected) {
        return () => this.props.dispatch((selected ? remove : add)(id))
    }

    togglePuppets(selected) {
        return () => this.props.dispatch(setSharedPuppets(selected ? Object.keys(this.props.puppets) : []))
    }

    render() {
        const { puppets, puppetThumbnails, sharedPuppets } = this.props

        return <div className="action">
            <Foldable title="Shared Puppets" subtitle="that other users can see and copy">
                <div style={{ display: 'flex' }}>
                    <button onClick={this.togglePuppets(false)}>None</button>
                    <button onClick={this.togglePuppets(true)}>All</button>
                </div>
                <div className="multiplayer-users">
                    {Object.keys(puppets).map(id => {
                        const puppet = puppets[id]
                        const selected = sharedPuppets.includes(id)
                        const className = cx({
                            char: true,
                            selector: true,
                            selected
                        })
                        return <div className={className} onClick={this.togglePuppet(id, selected)}>
                            <div className="desc">{puppet.name}</div>
                            <img
                                alt={puppet.name}
                                src={puppetThumbnails[id]}
                                draggable={false} />
                        </div>
                    })}
                </div>
            </Foldable>
        </div>
    }
}

function mapStateToProps(state) {
    return {
        puppets: state.project.characters,
        puppetThumbnails: state.project.characterThumbnails,
        sharedPuppets: state.project.settings.networking.sharedPuppets
    }
}

export default connect(mapStateToProps)(SharedPuppets)
