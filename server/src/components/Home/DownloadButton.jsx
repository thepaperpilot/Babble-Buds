import React, { Component } from 'react'
 
export default class DownloadButton extends Component {
    render() {
        return <React.Fragment>
            <a href="https://github.com/thepaperpilot/Babble-Buds/releases/download/v0.8.2/BabbleBuds-win32-x64.zip" className="large-button">Download v0.8.2 for Windows</a>
            <div className="caption">
                <a href="https://github.com/thepaperpilot/Babble-Buds/releases">Older Versions</a>
                <a href="https://github.com/thepaperpilot/Babble-Buds/releases/tag/v0.8.2">Other platforms</a>
                <a href="https://github.com/thepaperpilot/Babble-Buds">Source Code</a>
            </div>
        </React.Fragment>
    }
}
