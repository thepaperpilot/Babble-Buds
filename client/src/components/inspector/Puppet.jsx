import React, {Component} from 'react'
import { connect } from 'react-redux'
import Scrollbar from 'react-custom-scroll'
import Header from './Header'
import Checkbox from './fields/Checkbox'
import Number from './fields/Number'
import Dropdown from './../ui/InspectorDropdown'
import {reducer} from './../controller/Emotes'
import PuppetContextMenu from './../puppets/PuppetContextMenu'

const path = window.require('path')

class Puppet extends Component {
    constructor(props) {
        super(props)

        this.changePuppet = this.changePuppet.bind(this)
        this.selectEmote = this.selectEmote.bind(this)
    }

    changePuppet(key) {
        return value => {
            this.props.dispatch({
                type: 'CHANGE_PUPPET',
                puppet: this.props.target,
                key,
                value
            })
        }
    }

    selectEmote(emote) {
        return () => {
            if (this.props.isBeingEdited) {
                this.props.dispatch({
                    type: 'SET_EDITOR_EMOTE',
                    emote
                })
            } else {
                const puppet = this.props.puppets[this.props.target]
                this.props.dispatch({
                    type: 'EDIT_PUPPET',
                    id: this.props.target,
                    character: puppet,
                    emote
                })
            }
        }
    }

    render() {
        const puppet = this.props.puppets[this.props.target]
        if (!puppet) return null
            
        const thumbnails = this.props.puppetThumbnails[this.props.target]
        const disabled = puppet.creator !== this.props.self

        const emotes = puppet.layers.children.reduce(reducer(this.props.assets), [])

        const LinkedPuppetContextMenu = PuppetContextMenu(this.props.contextmenu)

        return (
            <div className="inspector">
                <Header targetName={puppet.name} />
                <Dropdown menu={LinkedPuppetContextMenu}
                    id={`contextmenu-puppet-${this.props.contextmenu}`}
                    collect={() => ({ puppet: parseInt(this.props.target, 10) })}/>
                <div className="inspector-content">
                    <Scrollbar allowOuterScroll={true} heightRelativeToParent="100%">
                        <pre className="info">
                            Creator: {puppet.creator === this.props.self ? this.props.nick : puppet.creator}<br/>
                            OC: {puppet.oc === this.props.self ? this.props.nick : puppet.oc}
                        </pre>
                        <div className="action">
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
                                const lastIndex = thumbnails.lastIndexOf('.png')
                                const imageSource = path.join(thumbnails.slice(0, lastIndex),
                                    `${emote.emote}.png${thumbnails.slice(lastIndex + 4)}`)
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
        puppets: state.project.characters,
        puppetThumbnails: state.project.characterThumbnails,
        self: state.self,
        nick: state.project.settings.nickname,
        id: state.project.settings.actor.id,
        isBeingEdited,
        assets: state.project.assets,
        emote: isBeingEdited ? state.editor.present.emote : null
    }
}

export default connect(mapStateToProps)(Puppet)
