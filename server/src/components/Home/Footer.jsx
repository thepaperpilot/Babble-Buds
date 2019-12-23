import React, { Component } from 'react'
 
export default class Footer extends Component {
    render() {
        return <div className="footer">
            <div className="creator-info">
                <div>Babble Buds is solely developed by thepaperpilot (Anthony Lawn).</div>
                <div>
                    You can check him out at:
                    <a href="http://thepaperpilot.org">thepaperpilot.org</a>
                    <a href="https://www.linkedin.com/in/anthony-lawn-002a98a9/">LinkedIn</a>
                    <a href="https://twitter.com/ThePaperPilot">Twitter</a>
                </div>
            </div>
            <div className="discord-info">
                <div>Looking For Group?</div>
                <div>Try the <a target="_blank" href="https://discord.gg/WzejVAx">Babble Buds Discord Server</a>!</div>
            </div>
        </div>
    }
}
