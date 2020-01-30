import React, { Component } from 'react'
import { connect } from 'react-redux'
import Vector2 from './fields/Vector2'
import Foldable from '../ui/Foldable'
import { changeEmitter } from '../../redux/editor/layers'

class RotationSection extends Component {
    constructor(props) {
        super(props)

        this.changeStartRotation = this.changeStartRotation.bind(this)
        this.changeRotationSpeed = this.changeRotationSpeed.bind(this)
    }

    changeStartRotation(value) {
        this.props.dispatch(changeEmitter(this.props.target, { startRotation: { min: value[0], max: value[1] } }))
    }

    changeRotationSpeed(value) {
        this.props.dispatch(changeEmitter(this.props.target, { rotationSpeed: { min: value[0], max: value[1] } }))
    }

    render() {
        const {
            startRotation, rotationSpeed
        } = this.props

        return <div className="action">
            <Foldable title="Particle Rotation">
                <Vector2
                    title="Start Rotation"
                    value={[startRotation.min, startRotation.max]}
                    onChange={this.changeStartRotation}
                    xLabel="Min"
                    yLabel="Max"
                    float={true}
                    help="Angle at which the particles are pointed when emitted. 0 is to the right and 90 is down." />
                <Vector2
                    title="Rotation Speed"
                    value={[rotationSpeed.min, rotationSpeed.max]}
                    onChange={this.changeRotationSpeed}
                    xLabel="Min"
                    yLabel="Max"
                    float={true}
                    help="Speed at which particles can rotate in degrees per second. Positive numbers rotate clockwise. Does not affect movement direction." />
            </Foldable>
        </div>
    }
}

export default connect()(RotationSection)
