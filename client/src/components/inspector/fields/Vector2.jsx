import React, {Component} from 'react'

class Vector2 extends Component {

    getValue(value) {
        return (this.props.float ? parseFloat : parseInt)(value, 10) || 0
    }

    render() {

        return (
            <div className="field">
                <p className="field-title">{this.props.title}</p>
                <div className="field-flex">
                    <div className="field-label">X</div>
                    <input
                        type="number"
                        value={this.getValue(this.props.value[0])}
                        onChange={e => this.props.onChange([this.getValue(e.target.value), this.getValue(this.props.value[1])])}
                        step={this.props.step}
                        disabled={this.props.disabled} />
                    <div className="field-label">Y</div>
                    <input
                        type="number"
                        value={this.getValue(this.props.value[1])}
                        onChange={e => this.props.onChange([this.getValue(this.props.value[0]), this.getValue(e.target.value)])}
                        step={this.props.step}
                        disabled={this.props.disabled} />
                </div>
            </div>
        )
    }
}

export default Vector2
