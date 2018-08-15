import React, {Component} from 'react'

class Number extends Component {
    render() {
        return (
            <div className="field">
                <p className="field-title">{this.props.title}</p>
                <input
                    type="number"
                    value={(this.props.float ? parseFloat : parseInt)(this.props.value, 10) || 0}
                    onChange={e => this.props.onChange((this.props.float ? parseFloat : parseInt)(e.target.value, 10))}
                    step={this.props.step}
                    disabled={this.props.disabled} />
            </div>
        )
    }
}

export default Number
