import React, {Component} from 'react'
import { connect } from 'react-redux'
import Scrollbar from 'react-custom-scroll'
import Header from './Header'
import Checkbox from './fields/Checkbox'
import Number from './fields/Number'
import Dropdown from './../ui/Dropdown'

class Puppet extends Component {
    constructor(props) {
        super(props)

        this.duplicatePuppet = this.duplicatePuppet.bind(this)
        this.deletePuppet = this.deletePuppet.bind(this)
        this.changePuppet = this.changePuppet.bind(this)
        this.selectEmote = this.selectEmote.bind(this)
    }

    duplicatePuppet() {
        this.props.dispatch({
            type: 'DUPLICATE_PUPPET',
            puppet: this.props.target
        })
    }

    deletePuppet() {
        if (this.props.target === this.props.id) {
            this.props.dispatch({
                type: 'ERROR',
                content: 'You can\'t delete your active puppet. Please switch puppets and try again.'
            })
        } else {
            this.props.dispatch({
                type: 'DELETE_PUPPET',
                puppet: this.props.target
            })
        }
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
            this.props.dispatch({
                type: 'SET_EDITOR_EMOTE',
                emote
            })
        }
    }

    render() {
        // TODO target is either the id of a puppet of ours, or an owner id for a puppet being controlled by a connected client
        const puppet = this.props.puppets[this.props.target]
        const thumbnails = this.props.puppetThumbnails[this.props.target].slice(0, -4)
        const disabled = puppet.creator !== this.props.self

        const dropdownItems = [
            { label: 'Duplicate Puppet', onClick: this.duplicatePuppet }
        ]

        if (!disabled) {
            dropdownItems.push({
                label: 'Delete Puppet',
                onClick: this.deletePuppet
            })
        }

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
        const emotes = puppet.layers.children.reduce(reducer, [])

        return (
            <div className="inspector">
                <Header targetName={puppet.name} />
                <Dropdown items={dropdownItems}/>
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
                                return (
                                    <div
                                        className="list-item"
                                        style={{height: '120px', width: '120px'}}
                                        onClick={this.selectEmote(emote.emote)}
                                        key={emote.name} >
                                        <div className={emote.emote === this.props.emote ? "char selected" : "char"} key={emote.name}>
                                            <img alt={emote.name} src={`${thumbnails}/${emote.emote}.png`}/>
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
    return {
        puppets: state.project.characters,
        puppetThumbnails: state.project.characterThumbnails,
        self: state.self,
        nick: state.project.settings.nickname,
        id: state.project.settings.actor.id,
        emote: props.target == state.editor.present.id ? state.editor.present.emote : null
    }
}

export default connect(mapStateToProps)(Puppet)
