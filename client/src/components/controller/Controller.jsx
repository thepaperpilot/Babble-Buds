import React, {Component} from 'react'
import Emotes from './Emotes'
import Characters from './Characters'
import './controller.css'

class Controller extends Component {
    render() {
        return (
            <div className="controller-container">
                <Characters id={this.props.id} />
                <Emotes />
            </div>
        )
    }
}

export default Controller
