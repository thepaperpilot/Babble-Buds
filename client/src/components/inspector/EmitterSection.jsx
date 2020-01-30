import React, { Component } from 'react'
import { connect } from 'react-redux'
import Number from './fields/Number'
import Foldable from '../ui/Foldable'
import { changeEmitter } from '../../redux/editor/layers'

class EmitterSection extends Component {
    constructor(props) {
        super(props)

        this.changeEmitter = this.changeEmitter.bind(this)
    }

    changeEmitter(key) {
        return value => this.props.dispatch(changeEmitter(this.props.target, { [key]: value }))
    }

    render() {
        const {
            frequency, emitterLifetime, maxParticles
        } = this.props

        return <div className="action">
            <Foldable title="Particle Emitter">
                {maxParticles > 1000 ? <pre className="error">
                    Having a very high max particles count can cause a lot of lag!
                </pre> : null}
                <Number
                    title="Spawn Frequency"
                    value={frequency}
                    onChange={this.changeEmitter('frequency')}
                    float={true}
                    step={.001}
                    help="Seconds between each particle being spawned." />
                <Number
                    title="Emitter Lifetime"
                    value={emitterLifetime}
                    onChange={this.changeEmitter('emitterLifetime')}
                    float={true}
                    step={.001}
                    help="How long the emitter runs for. Values of 0 or -1 are infinite." />
                <Number
                    title="Max Particles"
                    value={maxParticles}
                    onChange={this.changeEmitter('maxParticles')}
                    help="Max number of particles that can exist at one time." />
            </Foldable>
        </div>
    }
}

export default connect()(EmitterSection)
