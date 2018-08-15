import React, { Component } from 'react'

const electron = window.require('electron')
const remote = electron.remote
const util = remote.require('./main-process/util')
const app = remote.app

const path = require('path')

function browse(event) {
    event.preventDefault()
    util.selectDirectory()
}

class NewProject extends Component {
    constructor() {
        super()
        this.state = {
            title: 'MyProject1',
            location: path.join(app.getPath('home'), 'projects'),
            samplePuppet: true
        }
        this.handleSubmit = this.handleSubmit.bind(this)
        this.handleCheckbox = this.handleCheckbox.bind(this)
        this.handleChange = this.handleChange.bind(this)
    }

    componentDidMount() {
        electron.ipcRenderer.on('set directory', (event, location) => {
            this.setState({
                location
            })
        })
    }

    handleChange(event) {
        this.setState({
            [event.target.name]: event.target.value
        })
    }

    handleCheckbox(event) {
        this.setState({
            [event.target.name]: event.target.checked
        })
    }

    handleSubmit(event) {
        event.preventDefault()
        util.newProject(this.state.title, this.state.location, this.state.samplePuppet)
    }

    render() {
        return (
            <form onSubmit={this.handleSubmit}>
                Project Title:<br/>
                <input
                    type="text"
                    value={this.state.title}
                    name="title"
                    onChange={this.handleChange} />
                Location:<br/>
                <input
                    type="text"
                    style={{width: 'calc( 100% - 115px )'}}
                    name="location"
                    value={this.state.location}
                    onChange={this.handleChange} />
                <button type='button' onClick={browse}>Browse</button><br/>
                <input
                    type="checkbox"
                    id="sample"
                    name="samplePuppet"
                    className="checkbox"
                    checked={this.state.samplePuppet}
                    onChange={this.handleCheckbox} />
                <label htmlFor="sample" className="checkbox-label">Include sample puppet</label><br/>
                <button type='submit'>Create</button>
            </form>
        )
    }
}

export default NewProject
