import React, {Component} from 'react'
import { connect } from 'react-redux'
import Babble from './Babble'

const path = window.require('path')
const fs = window.require('fs-extra')

const hotkeys = [
    ['u', 'i', 'o', 'p'],
    ['j', 'k', 'l', ';'],
    ['m', ',', '.', '/']
]

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
        const thumbnailsPath = path.join(this.props.charactersPath, '..', 'thumbnails')
        const reducer = (acc, curr) => {
            if (curr.emote != null) {
                return acc.concat({
                    emote: curr.emote,
                    name: curr.name
                })
            } else if (curr.children) {
                return curr.children.reduce(reducer, acc)
            } else return acc
        }
        const emotes = this.props.characters[this.props.actor.id].layers.children.reduce(reducer, [])
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
                            const imageSource = emote ? 
                                `file://${path.join(thumbnailsPath,
                                    fs.existsSync(path.join(thumbnailsPath, `new-${character.id}`, `${index}.png`)) ?
                                        `new-${character.id}` :
                                        `${character.id}`,
                                    `${index}.png`)}` :
                                ''
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
        charactersPath: state.project.charactersPath
    }
}

export default connect(mapStateToProps)(Emotes)
