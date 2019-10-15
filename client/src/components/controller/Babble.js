import React, {Component} from 'react'
import { connect } from 'react-redux'
import { setBabbling } from '../../redux/controller'

class Babble extends Component {
    constructor(props) {
        super(props)

        this.startBabbling = this.startBabbling.bind(this)
        this.stopBabbling = this.stopBabbling.bind(this)
    }

    startBabbling() {
        this.props.dispatch(setBabbling(true))
    }

    stopBabbling() {
        this.props.dispatch(setBabbling())
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
        babbling: state.controller.babbling
    }
}

export default connect(mapStateToProps)(Babble)
