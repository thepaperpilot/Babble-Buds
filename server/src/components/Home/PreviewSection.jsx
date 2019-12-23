import React, { Component } from 'react'
import Section from '../Containers/Section.jsx'

export default class PreviewSection extends Component {
    render() {
        return <Section>
            <img src="preview.png" />
            <div>This is the current default interface, allowing the user to see the stage, control their character, and even edit their puppets at the same time!</div>
        </Section>
    }
}
