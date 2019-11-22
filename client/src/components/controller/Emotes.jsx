import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Puppet } from 'babble.js'
import Babble from './Babble'
import { setEmote } from '../../redux/controller'
import './controller.css'

const path = window.require('path')

const hotkeys = [
    ['u', 'i', 'o', 'p'],
    ['j', 'k', 'l', ';'],
    ['m', ',', '.', '/']
]

export function getEmotes(assets, layer) {
    const emotes = []
    Puppet.handleLayer(assets, layer, layer => {
        if (layer.emote != null && (!layer.inherit || layer.inherit.emote == null))
            emotes.push({
                emote: layer.emote,
                name: layer.name
            })
    })
    return emotes
}

const Hotkey = ({index, i, emotes, actor, characterThumbnail, changeEmote}) => {
    const emote = emotes.find(e => e.emote === index)
    const emoteName = emote ? emote.name : ''
    
    let emoteClass = 'emote selector'
    if (emote) emoteClass += ' available'
    if (actor.emote === index)
        emoteClass += ' selected'

    let thumbnail = ''
    if (emote) {
        const lastIndex = characterThumbnail.lastIndexOf('.png')
        thumbnail = path.join(characterThumbnail.slice(0, lastIndex),
            `${index}.png${characterThumbnail.slice(lastIndex + 4)}`)
    }

    return <div
        className={emoteClass}
        onClick={changeEmote(index)}>
        <div className="hotkey">{i}</div>
        <div className="desc">{emoteName}</div>
        {emote && <img alt={emoteName} src={thumbnail} draggable={false} />}
    </div>
}

class Emotes extends Component {
    constructor(props) {
        super(props)

        this.changeEmote = this.changeEmote.bind(this)
    }

    changeEmote(index) {
        return () => this.props.dispatch(setEmote(index))
    }

    render() {
        const emotes = this.props.actors.map((actor, i) =>
            getEmotes(this.props.assets, actor.character.layers))

        return <div className="controller-container">
            <div className="flex-column">
                {hotkeys.map((n, nIndex) => (
                    <div key={nIndex} className="flex-row">
                        {n.map((i, iIndex) => {
                            const index = n.length * nIndex + iIndex
                            // Find which actor we'll be using
                            const charIndex =
                                emotes.findIndex(emotes => emotes.find(e => e.emote === index))

                            // Find out if they exist
                            if (charIndex === -1) {
                                return <div key={iIndex} className="emote selector">
                                    <div className="hotkey">{i}</div>
                                </div>
                            }

                            return <Hotkey
                                key={iIndex}
                                i={i}
                                index={index}
                                emotes={emotes[charIndex]}
                                actor={this.props.actors[charIndex]}
                                characterThumbnail={this.props.thumbnails[charIndex]}
                                changeEmote={this.changeEmote} />
                        })}
                    </div>))}
                <Babble />
            </div>
        </div>
    }
}

function mapStateToProps(state) {
    const actors = state.controller.actors.map(id =>
        state.actors.find(actor => actor.id === id))
    return {
        actors,
        thumbnails: actors.map(actor =>
            state.project.characterThumbnails[actor.puppetId]),
        assets: state.project.assets
    }
}

export default connect(mapStateToProps)(Emotes)
