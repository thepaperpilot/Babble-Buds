import React, { Component } from 'react'
import { connect } from 'react-redux'
import Slider from './fields/Slider'
import Color from './fields/Color'
import Foldable from '../ui/Foldable'
import { changeEmitter } from '../../redux/editor/layers'

class ColorSection extends Component {
    constructor(props) {
        super(props)

        this.changeColor = this.changeColor.bind(this)
        this.changeAlpha = this.changeAlpha.bind(this)
    }

    changeColor(key) {
        return value => this.props.dispatch(changeEmitter(this.props.target, { color: Object.assign({}, this.props.color, { [key]: value }) }))
    }

    changeAlpha(key) {
        return value => this.props.dispatch(changeEmitter(this.props.target, { alpha: Object.assign({}, this.props.alpha, { [key]: value }) }))
    }

    render() {
        const { alpha, color } = this.props

        return <div className="action">
            <Foldable title="Color">
                <Color
                    title="Start Color"
                    value={color.start}
                    onChange={this.changeColor('start')} />
                <Slider
                    title="Start Opacity"
                    max={1}
                    value={alpha.start}
                    onChange={this.changeAlpha('start')}
                    help="1 is completely visible and 0 is completely see-through."
                    float={true}
                    step={.05} />
                <Color
                    title="End Color"
                    value={color.end}
                    onChange={this.changeColor('end')} />
                <Slider
                    title="End Opacity"
                    max={1}
                    value={alpha.end}
                    onChange={this.changeAlpha('end')}
                    help="1 is completely visible and 0 is completely see-through."
                    float={true}
                    step={.05} />
            </Foldable>
        </div>
    }
}

export default connect()(ColorSection)
