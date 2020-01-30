import React, {Component} from 'react'
import './vector.css'

class Vector2 extends Component {

    getValue(value) {
        return (this.props.float ? parseFloat : parseInt)(value, 10) || 0
    }

    render() {

        return (
            <div className="field vector">
                <p className="field-title">{this.props.title}</p>
                <div className="field-flex">
                    <div className="field-label">{this.props.xLabel || 'X'}</div>
                    <input
                        type="number"
                        value={this.getValue(this.props.value[0])}
                        onChange={e => this.props.onChange([this.getValue(e.target.value), this.getValue(this.props.value[1])])}
                        step={this.props.step}
                        disabled={this.props.disabled} />
                    <div className="field-label">{this.props.yLabel || 'Y'}</div>
                    <input
                        type="number"
                        value={this.getValue(this.props.value[1])}
                        onChange={e => this.props.onChange([this.getValue(this.props.value[0]), this.getValue(e.target.value)])}
                        step={this.props.step}
                        disabled={this.props.disabled} />
                </div>
                {this.props.help && <div className="flex-help" data-tooltip={this.props.help} />}
            </div>
        )
    }
}

export default Vector2
