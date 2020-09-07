import React, { Component } from 'react'
 
export default class DownloadButton extends Component {
    render() {
        return <React.Fragment>
            <a href="https://github.com/thepaperpilot/Babble-Buds/releases/download/v0.9.99-weekly.1/BabbleBuds-win32-x64.zip" className="large-button">Download current pre-release for Windows</a>
            <div className="caption">
                <a href="https://github.com/thepaperpilot/Babble-Buds/releases">Older Versions</a>
                <a href="https://github.com/thepaperpilot/Babble-Buds/releases/tag/v0.9.99-weekly.1">Other platforms</a>
                <a href="https://github.com/thepaperpilot/Babble-Buds">Source Code</a>
            </div>
        </React.Fragment>
    }
}
