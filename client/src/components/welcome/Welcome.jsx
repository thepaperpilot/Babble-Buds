import React, { Component } from 'react'
import OpenProject from './OpenProject'
import NewProject from './NewProject'
import Console from './../console/Console'
import splash from './../../data/splash.json'
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
