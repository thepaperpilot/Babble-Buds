import React, { Component } from 'react'
import Section from '../Containers/Section.jsx'

export default class IntroSection extends Component {
    render() {
        return <Section title="Hello!">
            Babble Buds is a free, open source, program based off the Puppet Pals software used in Robert Moran's URealms Live series. It features a stage in which you and others can control puppets to act out roleplay scenes for things like tabletop role playing games. It also includes an integrated puppet editor so you can create as many puppets as you want with various facial expressions, and change them on the fly as the situation dictates. 
        </Section>
    }
}
