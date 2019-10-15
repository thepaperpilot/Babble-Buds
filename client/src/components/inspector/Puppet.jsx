import React, { Component } from 'react'
import { connect } from 'react-redux'
import Scrollbar from 'react-custom-scroll'
import Header from './Header'
import Checkbox from './fields/Checkbox'
import Number from './fields/Number'
import Dropdown from '../ui/InspectorDropdown'
import { getEmotes } from '../controller/Emotes'
import PuppetContextMenu from '../puppets/PuppetContextMenu'
import { open } from '../../redux/editor/editor'
import { setEmote } from '../../redux/editor/selected'
import { changeCharacter } from '../../redux/project/characters/actions'

const path = window.require('path')

class Puppet extends Component {
    constructor(props) {
        super(props)

        this.changePuppet = this.changePuppet.bind(this)
        this.selectEmote = this.selectEmote.bind(this)
    }

    changePuppet(key) {
        return value => {
            this.props.dispatch(changeCharacter(this.props.target, { [key]: value }))
        }
    }

    selectEmote(emote) {
        return () => {
            if (this.props.isBeingEdited) {
                this.props.dispatch(setEmote(emote))
            } else {
                const puppet = this.props.puppet
                this.props.dispatch(open(this.props.target, puppet.layers, 'puppet', emote))
            }
        }
    }

    render() {
        const { puppet, thumbnail } = this.props
        if (!puppet) return null

        const disabled = puppet.creator !== this.props.self

        const emotes = getEmotes(this.props.assets, puppet.layers)

        const LinkedPuppetContextMenu = PuppetContextMenu(this.props.contextmenu)

        return (
            <div className="inspector">
                <Header targetName={puppet.name} />
                <Dropdown menu={LinkedPuppetContextMenu}
                    id={`contextmenu-puppet-${this.props.contextmenu}`}
                    collect={() => ({ puppet: parseInt(this.props.target, 10) })}/>
                <div className="inspector-content">
                    <Scrollbar allowOuterScroll={true} heightRelativeToParent="100%">
                        <div className="action">
                            <pre className="info">
                                Creator: {puppet.creator === this.props.self ? this.props.nick : puppet.creator}<br/>
                                OC: {puppet.oc === this.props.self ? this.props.nick : puppet.oc}
                            </pre>
                            <Checkbox
                                title="Bobble head while talking"
                                value={puppet.deadbonesStyle}
                                onChange={this.changePuppet('deadbonesStyle')}
                                disabled={disabled} />
                            <Number
                                title="Eyes Duration (while babbling)"
                                value={puppet.eyeBabbleDuration || 2000}
                                onChange={this.changePuppet('eyeBabbleDuration')}
                                disabled={disabled} />
                            <Number
                                title="Mouth Duration (while babbling)"
                                value={puppet.mouthBabbleDuration || 270}
                                onChange={this.changePuppet('mouthBabbleDuration')}
                                disabled={disabled} />
                        </div>
                        <div className="list">
                            {emotes.map(emote => {
                                const lastIndex = thumbnail.lastIndexOf('.png')
                                const imageSource = path.join(thumbnail.slice(0, lastIndex),
                                    `${emote.emote}.png${thumbnail.slice(lastIndex + 4)}`)
                                return (
                                    <div
                                        className="list-item"
                                        style={{height: '120px', width: '120px'}}
                                        onClick={this.selectEmote(emote.emote)}
                                        key={emote.name} >
                                        <div className={emote.emote === this.props.emote ? 'char selected' : 'char'} key={emote.name}>
                                            <img alt={emote.name} src={imageSource}/>
                                            <div className="desc">{emote.name}</div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </Scrollbar>
                </div>
            </div>
        )
    }
}

function mapStateToProps(state, props) {
    const isBeingEdited = props.target == state.editor.present.id
    return {
        puppet: state.project.characters[props.target],
        thumbnail: state.project.characterThumbnails[props.target],
        self: state.self,
        nick: state.project.settings.nickname,
        isBeingEdited,
        assets: state.project.assets,
        emote: isBeingEdited ? state.editor.present.selected.emote : null
    }
}

export default connect(mapStateToProps)(Puppet)
