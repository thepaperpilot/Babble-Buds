import React, { Component } from 'react'
import Text from './../inspector/fields/Text'
import Location from './../inspector/fields/Location'
import Checkbox from './../inspector/fields/Checkbox'

const {remote} = window.require('electron')
const util = remote.require('./main-process/util')
const app = remote.app

const path = require('path')

class NewProject extends Component {
    constructor() {
        super()

        this.state = {
            title: 'MyProject1',
            location: path.join(app.getPath('home'), 'projects'),
            samplePuppet: true
        }

        this.handleSubmit = this.handleSubmit.bind(this)
        this.handleChange = this.handleChange.bind(this)
    }

    handleChange(key) {
        return value => this.setState({
            [key]: value
        })
    }

    handleSubmit(event) {
        event.preventDefault()
        util.newProject(this.state.title, this.state.location, this.state.samplePuppet)
    }

    render() {
        return (
            <form onSubmit={this.handleSubmit} className="new-project action">
                <div className="section-title">New Project</div>
                <Text
                    title="Project Title"
                    value={this.state.title}
                    onChange={this.handleChange('title')} />
                <Location
                    title="Location"
                    value={this.state.location}
                    onChange={this.handleChange('location')} />
                <Checkbox
                    title="Include Sample Puppet"
                    value={this.state.samplePuppet}
                    onChange={this.handleChange('samplePuppet')} />
                <button type='submit'>Create</button>
            </form>
        )
    }
}

export default NewProject
