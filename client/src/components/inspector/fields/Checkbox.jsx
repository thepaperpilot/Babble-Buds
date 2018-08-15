import React, {Component} from 'react'
import './checkbox.css'

class Checkbox extends Component {
    static uniqueId = 0

    constructor(props) {
        super(props)

        this.state = {
            id: Checkbox.uniqueId++
        }

        this.onChange = this.onChange.bind(this)
    }

    onChange(e) {
        e.stopPropagation()
        this.props.onChange(e.target.checked)
    }

    render() {
        return (
            <div className="field">                
                {this.props.inline || <p className="field-title">{this.props.title}</p>}
                <input
                    id={`checkbox-${this.state.id}`}
                    type="checkbox"
                    className="checkbox"
                    checked={!!this.props.value}
                    onChange={this.onChange}
                    disabled={this.props.disabled} />
                <label
                    htmlFor={`checkbox-${this.state.id}`}
                    className="checkbox-label">
                    {this.props.inline && this.props.title}
                </label>
                {this.props.help && <div className="flex-help" data-tooltip={this.props.help} />}
            </div>
        )
    }
}

export default Checkbox
