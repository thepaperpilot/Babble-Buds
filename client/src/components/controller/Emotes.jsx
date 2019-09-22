import React, {Component} from 'react'
import { connect } from 'react-redux'
import {Puppet} from 'babble.js'
import Babble from './Babble'

const path = window.require('path')

const hotkeys = [
    ['u', 'i', 'o', 'p'],
    ['j', 'k', 'l', ';'],
    ['m', ',', '.', '/']
]

export function getEmotes(assets, layer) {
    const emotes = []
    Puppet.handleLayer(assets, layer, layer => {
        if (layer.emote != null && layer.inherit && layer.inherit.emote == null)
            emotes.push({
                emote: layer.emote,
                name: layer.name
            })
    })
    return emotes
}

class Emotes extends Component {
    constructor(props) {
        super(props)

        this.changeEmote = this.changeEmote.bind(this)
    }

    changeEmote(index) {
        return () => this.props.dispatch({
            type: 'SET_EMOTE_SELF',
            emote: index
        })
    }

    render() {
        const emotes = getEmotes(this.props.assets, this.props.characters[this.props.actor.id].layers)
        const character = this.props.characters[this.props.actor.id]
        return (
            <div className="flex-column">
                {hotkeys.map((n, nIndex) => (
                    <div key={nIndex} className="flex-row">
                        {n.map((i, iIndex) => {
                            if (!character) {
                                return (<div key={iIndex} className="emote"><div className="hotkey">{i}</div></div>)
                            }
                            const index = n.length * nIndex + iIndex
                            const emote = emotes.find(e => e.emote === index)
                            const emoteName = emote ? emote.name : ''
                            let emoteClass = 'emote selector'
                            if (emote) emoteClass += ' available'
                            if (this.props.actor.emote === index) emoteClass += ' selected'
                            let imageSource = this.props.characterThumbnails[this.props.actor.id]
                            if (emote) {
                                const lastIndex = imageSource.lastIndexOf('.png')
                                imageSource = path.join(imageSource.slice(0, lastIndex),
                                    `${index}.png${imageSource.slice(lastIndex + 4)}`)
                            } else imageSource = ''
                            return (
                                <div
                                    key={iIndex}
                                    className={emoteClass}
                                    onClick={this.changeEmote(index)}>
                                    <div className="hotkey">{i}</div>
                                    <div className="desc">{emoteName}</div>
                                    {emote && <img alt={emoteName} src={imageSource}/>}
                                </div>)})}
                    </div>))}
                <Babble />
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        characters: state.project.characters,
        actor: state.project.settings.actor,
        characterThumbnails: state.project.characterThumbnails,
        assets: state.project.assets
    }
}

export default connect(mapStateToProps)(Emotes)
