import React, {Component} from 'react'
import { connect } from 'react-redux'

const remote = window.require('electron').remote

class BrokenPanel extends Component {
    constructor(props) {
        super(props)

        this.state = {
            hasError: false
        }
    }

    static getDerivedStateFromError() {
        return { hasError: true }
    }
    
    componentDidCatch(error) {
        const panel = (this.props.panel.charAt(0).toUpperCase() + this.props.panel.slice(1)).replace('-', ' ')
        this.props.dispatch({
            type: 'ERROR',
            content: `${panel} Panel crashed due to the following error: ${error.name}: ${error.message}`,
            error
        })
    }

    toggleDevTools() {
        remote.getCurrentWindow().toggleDevTools()
    }

    render() {
        if (this.state.hasError) {
            return <div className="default broken">
                <p>Oh no! This panel crashed :(</p>
                <button onClick={this.toggleDevTools}>Toggle Dev Tools</button>
            </div>
        }

        return this.props.children
    }
}

export default connect()(BrokenPanel)
