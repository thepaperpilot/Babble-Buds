import React, {Component} from 'react'
import { connect } from 'react-redux'

class Babble extends Component {
    constructor(props) {
        super(props)

        this.startBabbling = this.startBabbling.bind(this)
        this.stopBabbling = this.stopBabbling.bind(this)
    }

    startBabbling() {
        this.props.dispatch({ type: 'START_BABBLING_SELF' })
    }

    stopBabbling() {
        this.props.dispatch({ type: 'STOP_BABBLING_SELF' })
    }

    render() {
        return <div className="flex-row">
            <div
                className={`babble selector${this.props.babbling ? ' selected' : ''}`}
                onMouseDown={this.startBabbling}
                onMouseUp={this.stopBabbling}>
                <div className="hotkey">space</div>
                <div className="desc">Babble</div>
            </div>
        </div>
    }
}

function mapStateToProps(state) {
    return {
        babbling: state.babbling
    }
}

export default connect(mapStateToProps)(Babble)
