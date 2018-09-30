import React, {Component} from 'react'
import Textarea from 'react-autosize-textarea'

class Text extends Component {
    render() {
        const {title, value, onChange, ...props} = this.props
        return this.props.textarea ?
            <div className="field text">
                <p className="field-title">{title}</p>
                <Textarea value={value} onChange={e => onChange(e.target.value)} />
            </div> :
            <div className="field text">
                <p className="field-title">{title}</p>
                <input type="text" value={value} onChange={e => onChange(e.target.value)} {...props} />
            </div>
    }
}

export default Text
