import React, { Component } from 'react'
import OpenProject from './OpenProject'
import NewProject from './NewProject'
import Console from './../console/Console'
import splash from './../../data/splash.json'

import './fonts/m0Shgsxo4xCSzZHO6RHWxBTbgVql8nDJpwnrE27mub0.woff2'
import './fonts/6RfRbOG3yn4TnWVTc898ERTbgVql8nDJpwnrE27mub0.woff2'
import './fonts/Q_Z9mv4hySLTMoMjnk_rCfesZW2xOQ-xsNqO47m55DA.woff2'
import './welcome.css'

class Welcome extends Component {
    render() {
        return <div className="welcome">
            <div className="container">
                <div className="title-wrapper">
                    <span className="title">Babble</span>
                    <span className="title">Buds</span>
                </div>
                <div className="splash">
                    <div className="splash-text">
                        {splash[Math.floor(Math.random() * splash.length)]}
                    </div>
                </div>
                <OpenProject />
                <NewProject />
                <div className="console">
                    <div className="section-title">Console</div>
                    <Console />
                </div>
            </div>
        </div>
    }
}

export default Welcome
