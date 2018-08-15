import React, {Component} from 'react'
import { connect } from 'react-redux'

class Slider extends Component {
    render() {
        const max = this.props.max === 'numCharacters' ?
            this.props.numCharacters + 1 :
            this.props.max || 0

        return (<div className="field">
            <p className="field-title">{this.props.title}</p>
            <div style={{display: 'flex'}}>
                <span style={{flex: '0 1 auto', margin: '5px', alignSelf: 'center'}}>
                    {this.props.min || 0}
                </span>
                <input
                    type="range"
                    min={this.props.min || 0}
                    max={max}
                    style={{flex: '1 1 auto', margin: 'auto 4px'}}
                    value={parseInt(this.props.value, 10) || 0}
                    onChange={e => this.props.onChange(parseInt(e.target.value, 10))}
                    disabled={this.props.disabled} />
                <span style={{flex: '0 1 auto', margin: '5px', alignSelf: 'center'}}>
                    {max}
                </span>
            </div>
        </div>)
    }
}

function mapStateToProps(state) {
    return {
        numCharacters: state.project.settings.numCharacters
    }
}

export default connect(mapStateToProps)(Slider)
