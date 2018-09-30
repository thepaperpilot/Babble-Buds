import React, {Component} from 'react'

class Angle extends Component {
    render() {
        return (
            <div className="field angle">
                <p className="field-title">{this.props.title}</p>
                <input
                    type="number"
                    value={Math.round(1000 * (parseFloat(this.props.value, 10) || 0) / Math.PI) / 1000}
                    onChange={e => this.props.onChange(parseFloat(e.target.value, 10) * Math.PI)}
                    step={.001}
                    disabled={this.props.disabled} />
            </div>
        )
    }
}

export default Angle
