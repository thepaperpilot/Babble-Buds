import React, {Component} from 'react'
import { connect } from 'react-redux'
import './slider.css'

class Slider extends Component {
    getValue(value) {
        return (this.props.float ? parseFloat : parseInt)(value, 10) || 0
    }

    render() {
        const max = this.props.max === 'numCharacters' ?
            this.props.numCharacters + 1 :
            this.props.max || 0
        const value = this.getValue(this.props.value)

        return <div className="slider field">
            <p className="field-title">{this.props.title}</p>
            <div className="field-flex">
                <span style={{flex: '0 1 auto', margin: '5px', alignSelf: 'center'}}>
                    {this.props.min || 0}
                </span>
                <input
                    type="range"
                    min={this.props.min || 0}
                    max={max}
                    step={this.props.step}
                    style={{flex: '1 1 auto', margin: 'auto 4px'}}
                    value={value}
                    onChange={e => this.props.onChange(this.getValue(e.target.value))}
                    disabled={this.props.disabled} />
                <span className="slider-value">{value}</span>
                <span style={{flex: '0 1 auto', margin: '5px', alignSelf: 'center'}}>
                    {max}
                </span>
            </div>
            {this.props.help && <div className="flex-help" data-tooltip={this.props.help} />}
        </div>
    }
}

function mapStateToProps(state) {
    return {
        numCharacters: state.environment.numCharacters
    }
}

export default connect(mapStateToProps)(Slider)
