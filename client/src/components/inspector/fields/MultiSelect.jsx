import React, {Component} from 'react'
import { Creatable } from 'react-select'
import './multiselect.css'

class MultiSelect extends Component {
    render() {
        return (
            <div className="field">
                <p className="field-title">{this.props.title}</p>
                <Creatable
                    isMulti={true}
                    onChange={value => this.props.onChange(value.map(v => v.value))}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    placeholder="Type options..."
                    value={Array.isArray(this.props.value) ? this.props.value.map(v => ({ label: v, value: v })) : []} />
            </div>
        )
    }
}

export default MultiSelect
