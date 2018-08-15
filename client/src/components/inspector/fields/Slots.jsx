import React, {Component} from 'react'
import { connect } from 'react-redux'
import './checkbox.css'

class Slots extends Component {
    static uniqueId = 0

    constructor(props) {
        super(props)

        this.state = {
            id: Slots.uniqueId++
        }

        this.onChange = this.onChange.bind(this)
    }

    onChange(slot) {
        return e => {
            e.stopPropagation()
            this.props.onChange(e.target.checked ? slot : null)
        }
    }

    render() {
        const disabled = this.props.disabled || (() => false)
        return (
            <div className="field">                
                {this.props.inline || <p className="field-title">{this.props.title}</p>}
                <div className="field-flex-vertical">
                    {Array.from(new Array(this.props.rows), (val, r) => <div className="field-flex" key={r}>
                        {Array.from(new Array(this.props.cols), (val, c) => (<div key={c}>
                            <input
                                id={`checkbox-${this.state.id}-${r}-${c}`}
                                type="checkbox"
                                className="checkbox"
                                checked={this.props.value === r * this.props.cols + c}
                                onChange={this.onChange(r * this.props.cols + c)}
                                disabled={disabled(r * this.props.cols + c)} />
                            <label
                                htmlFor={`checkbox-${this.state.id}-${r}-${c}`}
                                className="checkbox-label">
                            </label>
                        </div>))}
                    </div>)}
                </div>
            </div>
        )
    }
}

export default connect()(Slots)
