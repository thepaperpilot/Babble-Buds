import React, { Component } from 'react'
import { connect } from 'react-redux'
import Number from './fields/Number'
import Foldable from '../ui/Foldable'
import { changeEmitter } from '../../redux/editor/layers'

class SizeSection extends Component {
    constructor(props) {
        super(props)

        this.changeScale = this.changeScale.bind(this)
    }

    changeScale(key) {
        return value => {
            const scale = Object.assign({}, this.props.scale, { [key]: value })
            this.props.dispatch(changeEmitter(this.props.target, { scale }))
        }
    }

    render() {
        const {
            start, end, minimumScaleMultiplier
        } = this.props.scale

        return <div className="action">
            <Foldable title="Particle Size">
                <Number
                    title="Start Scale"
                    value={start}
                    onChange={this.changeScale('start')}
                    float={true}
                    step={.1} />
                <Number
                    title="End Scale"
                    value={end}
                    onChange={this.changeScale('end')}
                    float={true}
                    step={.1} />
                <Number
                    title="Minimum Scale Multiplier"
                    value={minimumScaleMultiplier}
                    onChange={this.changeScale('minimumScaleMultiplier')}
                    help="A value between minimum scale multiplier and 1 is randomly generated and multiplied with start scale and end scale to provide the actual start scale and end scale for each particle."
                    float={true}
                    step={.1} />
            </Foldable>
        </div>
    }
}

export default connect()(SizeSection)
