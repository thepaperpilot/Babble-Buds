import React, { Component } from 'react'
import './welcome.css'
import Tabs from './../ui/Tabs'
import OpenProject from './OpenProject'
import NewProject from './NewProject'

class Welcome extends Component {
    render() {
        return (
            <div className="welcome">
                <div className="greeting">
                    <span className="greeting-header">Hello!</span><br/>
                    <Tabs tabs={{
                        'Open Project': <OpenProject />,
                        'New Project': <NewProject />
                    }}/>
                </div>
                <div className="version">Babble Buds v{window.require('electron').remote.app.getVersion()}-beta</div>
            </div>
        )
    }
}

export default Welcome
