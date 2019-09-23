import React, {Component} from 'react'
import { connect } from 'react-redux'
import Select from './fields/Select'
import Number from './fields/Number'
import Foldable from './../ui/Foldable'

class AnimationSection extends Component {
    constructor(props) {
        super(props)

        this.changeAnimation = this.changeAnimation.bind(this)
        this.changeLayer = this.changeLayer.bind(this)
    }

    changeAnimation(value) {
        this.props.dispatch({
            type: 'EDIT_LAYER',
            layer: this.props.target,
            key: 'animation',
            value: value === 'None' ? null : value.toUpperCase().replace(' ', '_')
        })
    }

    changeLayer(key) {
        return value => {
            this.props.dispatch({
                type: 'EDIT_LAYER',
                layer: this.props.target,
                key,
                value
            })
        }
    }

    render() {
        const {
            layer
        } = this.props

        const value = layer.animation ?
            layer.animation.replace('_', ' ').replace(/\w+/g,
                w => w[0].toUpperCase() + w.slice(1).toLowerCase()) :
            'None'

        return <div className="action">
            <Foldable title="Animation">
                <Select
                    title="Enter Animation"
                    options={['None', 'Fade', 'Fade Zoom']}
                    value={value}
                    onChange={this.changeAnimation} />
                {layer.animation ? <Select
                    title="Easing"
                    options={Object.keys(window.PIXI.tween.Easing).slice(0, -1)}
                    value={layer.easing || 'linear'}
                    onChange={this.changeLayer('easing')}
                    help="The easing method to use for interpolating the animation. Look up 'Animation Easing' for what that changes" /> : null}
                {layer.animation ? <Number
                    title="Duration"
                    value={layer.duration || 1000}
                    onChange={this.changeLayer('duration')}
                    help="How long the animation will take, in ms (1000 = 1 second)" /> : null}
                {layer.animation ? <Number
                    title="Delay"
                    value={layer.delay || 0}
                    onChange={this.changeLayer('delay')}
                    help="How long to wait before starting the animation, in ms (1000 = 1 second)" /> : null}
            </Foldable>
        </div>
    }
}

export default connect()(AnimationSection)
