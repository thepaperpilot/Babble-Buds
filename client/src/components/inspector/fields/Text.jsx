import React, {Component} from 'react'
import Textarea from 'react-autosize-textarea'

class Text extends Component {
    render() {
        return this.props.textarea ?
            <div className="field text">
                <p className="field-title">{this.props.title}</p>
                <Textarea value={this.props.value} onChange={e => this.props.onChange(e.target.value)} />
            </div> :
            <div className="field text">
                <p className="field-title">{this.props.title}</p>
                <input type="text" value={this.props.value} onChange={e => this.props.onChange(e.target.value)} />
            </div>
    }
}

export default Text
