import React, { Component } from 'react'

const remote = window.require('electron').remote
const util = remote.require('./main-process/util')
const settings = remote.require('./main-process/settings')
const app = remote.app

const path = require('path')

function onClick() {
    util.selectProject()
}

function openProject(project) {
    return () => util.openProject(project)
}

class OpenProject extends Component {
    constructor(props) {
        super(props)
        let recentProjects = settings.settings.recentProjects
        const selectors = []
        for (let i = 0; i < recentProjects.length; i++) {
            let filename = util.slugify(recentProjects[i])
            selectors.push(<div
                key={i}
                className="recent-project"
                onClick={openProject(recentProjects[i])} >
                <div className="desc">{recentProjects[i].replace(/^.*[\\/]/, '').replace(/\..*/, '')}</div>
                <img alt={recentProjects[i]} src={`file://${path.join(app.getPath('userData'), `${filename}.png`).replace(/\\/g, '/')}`}/>
            </div>)
        }
        this.state = {
            selectors
        }
    }

    render() {
        return (
            <div>
                Recent Projects:<br/>
                <div className="recent-projects">{this.state.selectors}</div>
                <button style={{margin: '8px auto', display: 'block'}} onClick={onClick}>Browse</button>
            </div>
        )
    }
}

export default OpenProject
