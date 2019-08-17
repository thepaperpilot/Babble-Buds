import React, {Component} from 'react'
import './controller.css'
import Emotes from './Emotes'
import Characters from './Characters'

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
