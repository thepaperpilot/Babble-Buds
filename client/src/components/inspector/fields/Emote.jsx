import React, {Component} from 'react'
import { connect } from 'react-redux'
import Autosuggest from 'react-autosuggest'
import SmallThumbnail from './../../ui/SmallThumbnail'
import './select.css'

class Emote extends Component {
    constructor(props) {
        super(props)

        // I get the feeling some people won't like that I do this:
        this.state = this.componentWillReceiveProps(props)

        this.renderSuggestion = this.renderSuggestion.bind(this)
        this.renderInputComponent = this.renderInputComponent.bind(this)
    }

    componentWillReceiveProps(props) {
        // Find puppet
        const name = Object.keys(props.action).find(key => {
            const field = props.commands.find(c => c.command === props.action.command).fields[key]
            return field && field.type === 'puppet'
        })
        const puppet = name !== null && props.puppets[props.action[name]] ?
            props.puppets[props.action[name]].name :
            (() => {
                const puppet = props.puppetStates.find(puppet => puppet.id === props.action.target)
                return puppet ? puppet.name : null
            })()

        if (puppet === null) return { options: [], selected: null }
        
        const options = []
        props.puppets[puppet].emotes.forEach((emote, i) => {
            if (emote.enabled) {
                const puppetThumbnail = props.puppetThumbnails[puppet]
                const pos = puppetThumbnail.lastIndexOf('.')
                options.push({
                    label: emote.name,
                    value: i,
                    thumbnail: `${puppetThumbnail.slice(0, pos)}/${i}.png`
                })
            }
        })

        const state = {
            options,
            selected: options.find(option => option.value === parseInt(props.value, 10) || 0)
        }

        if (this.state)
            this.setState(state)
        return state
    }

    renderSuggestion(suggestion) {
        return (
            <SmallThumbnail label={suggestion.label} image={suggestion.thumbnail} />
        )
    }

    renderInputComponent(props) {
        props.onChange = e => e.preventDefault()
        return (
            <div className="input-thumbnail">
                <div className="input-wrapper">
                    {this.state.selected == null ?
                        <div className="placeholder">
                            {this.state.options.length ?
                                'Select one...' :
                                'Can\'t find puppet'}
                        </div> :
                        <SmallThumbnail
                            label={this.state.selected.label}
                            image={this.state.selected.thumbnail} />
                    }
                </div>
                <input {...props} />
            </div>
        )
    }

    render() {
        const inputProps = {
            value: `${this.props.value || ''}`,
            onChange: (e, { newValue }) => this.props.onChange(newValue),
            disabled: this.props.disabled
        }

        return (
            <div className="autosuggest field select-field emote-field">
                <p className="field-title">{this.props.title}</p>
                <Autosuggest
                    focusInputOnSuggestionClick={false}
                    suggestions={this.state.options}
                    renderSuggestion={this.renderSuggestion}
                    renderInputComponent={this.renderInputComponent}
                    inputProps={inputProps}
                    shouldRenderSuggestions={() => true}
                    // These are required props but I'm not using this component
                    // like they intend and don't actually need these
                    // (I just don't want to make a new component since this one
                    //  does a lot of what I'd need already)
                    getSuggestionValue={suggestion => suggestion.value}
                    onSuggestionsClearRequested={() => null}
                    onSuggestionsFetchRequested={() => null} />
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        commands: state.project.settings.commands,
        puppets: state.project.puppets,
        puppetThumbnails: state.project.puppetThumbnails,
        puppetStates: state.puppets
    }
}

export default connect(mapStateToProps)(Emote)
