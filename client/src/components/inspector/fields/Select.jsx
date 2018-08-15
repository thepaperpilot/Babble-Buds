import React, {Component} from 'react'
import { connect } from 'react-redux'
import Autosuggest from 'react-autosuggest'
import './select.css'

class Select extends Component {
    constructor(props) {
        super(props)

        // I get the feeling some people won't like that I do this:
        this.state = this.componentWillReceiveProps(props)

        this.renderSuggestion = this.renderSuggestion.bind(this)
        this.renderInputComponent = this.renderInputComponent.bind(this)
    }

    componentWillReceiveProps(props) {        
        const options = (props.options || []).map(option => ({
            label: option,
            value: option
        }))

        const state = {
            options,
            selected: options.find(option => option.value === props.value)
        }

        if (this.state)
            this.setState(state)
        return state
    }

    renderSuggestion(suggestion) {
        return (
            <div>
                {suggestion.label}
            </div>
        )
    }

    renderInputComponent(props) {
        props.onChange = e => e.preventDefault()
        return (
            <div className="input-thumbnail">
                <div className="input-wrapper">
                    {this.state.selected == null ?
                        <div className="placeholder">Select one...</div> :
                        <div>{this.state.selected.label}</div>
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
            <div className="autosuggest field select-field">
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

export default connect()(Select)
