import React, { Component } from 'react'
import { connect } from 'react-redux'
import Number from './fields/Number'
import Vector2 from './fields/Vector2'
import Foldable from '../ui/Foldable'
import { changeEmitter } from '../../redux/editor/layers'

class SpeedSection extends Component {
    constructor(props) {
        super(props)

        this.changeEmitter = this.changeEmitter.bind(this)
        this.changeSpeed = this.changeSpeed.bind(this)
        this.changeAcceleration = this.changeAcceleration.bind(this)
    }

    changeEmitter(key) {
        return value => this.props.dispatch(changeEmitter(this.props.target, { [key]: value }))
    }

    changeSpeed(key) {
        return value => {
            const speed = Object.assign({}, this.props.speed, { [key]: value })
            this.props.dispatch(changeEmitter(this.props.target, { speed }))
        }
    }

    changeAcceleration([ x, y ]) {
        this.props.dispatch(changeEmitter(this.props.target, { acceleration: { x, y: -y } }))
    }

    render() {
        const { maxSpeed, acceleration } = this.props
        const {
            start, end, minimumSpeedMultiplier
        } = this.props.speed

        const isAccelerating = !!(acceleration.x || acceleration.y)

        return <div className="action">
            <Foldable title="Speed">
                <Number
                    title="Start"
                    value={start}
                    onChange={this.changeSpeed('start')}
                    float={true}
                    step={.1} />
                <Vector2
                    title="Acceleration"
                    value={[ acceleration.x, -acceleration.y]}
                    onChange={this.changeAcceleration}
                    help="Acceleration of particles. Prevents using end speed. Without a rotation speed defined, particles will rotate to match movement direction."
                    float={true}
                    step={.1} />
                {isAccelerating ? 
                    <Number
                        title="Max Speed"
                        value={maxSpeed}
                        onChange={this.changeEmitter('maxSpeed')}
                        help="The maximum speed allowed on accelerating particles. If particles are not using Acceleration, use Start Speed and End Speed instead."
                        float={true}
                        step={.1} /> :
                    <Number
                        title="End"
                        value={end}
                        onChange={this.changeSpeed('end')}
                        float={true}
                        step={.1} />}
                <Number
                    title="Minimum Speed Multiplier"
                    value={minimumSpeedMultiplier}
                    onChange={this.changeSpeed('minimumSpeedMultiplier')}
                    help="A value between minimum speed multipler and 1 is randomly generated and multiplied with start speed and end speed to provide the actual start speed and end speed for each particle."
                    float={true}
                    step={.1} />
            </Foldable>
        </div>
    }
}

export default connect()(SpeedSection)
