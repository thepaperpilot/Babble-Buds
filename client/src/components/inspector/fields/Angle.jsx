import React, {Component} from 'react'

class Angle extends Component {
    constructor(props) {
        super(props)

        this.state = {
            value: this.formatValue(props.value)
        }

        this.formatValue = this.formatValue.bind(this)
        this.handleChange = this.handleChange.bind(this)
    }

    componentWillReceiveProps(newProps) {
        if (parseFloat(this.state.value, 10) * Math.PI != newProps.value)
            this.setState({ value: this.formatValue(newProps.value) })
    }

    shouldComponentUpdate(newProps, newState) {
        return this.state.value !== newState.value
    }

    formatValue(value) {
        return value ? Math.round(1000 * (value || 0) / Math.PI) / 1000 : 0
    }

    handleChange(e) {
        this.setState({ value: e.target.value })
        this.props.onChange(parseFloat(e.target.value, 10) * Math.PI || undefined)
    }

    render() {
        return (
            <div className="field angle">
                <p className="field-title">{this.props.title}</p>
                <input
                    type="number"
                    value={this.state.value || ""}
                    onChange={this.handleChange}
                    step={.01}
                    disabled={this.props.disabled} />
            </div>
        )
    }
}

export default Angle
