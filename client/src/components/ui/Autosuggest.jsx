import React from 'react'
import Autosuggest from 'react-autosuggest'
import createFilterOptions from 'react-select-fast-filter-options'
import './autosuggest.css'
 
class AutosuggestWrapper extends React.Component {
    constructor() {
        super()
     
        this.state = {
            suggestions: []
        }

        this.autosuggest = React.createRef()

        this.onClear = this.onClear.bind(this)
        this.onSuggestionsClearRequested = this.onSuggestionsClearRequested.bind(this)
        this.renderSuggestion = this.renderSuggestion.bind(this)
    }

    onClear() {
        this.autosuggest.current.input.focus()
        this.props.onChange(null, { newValue: '' })
        this.setState({
            suggestions: this.props.options
        })
    }
 
    onSuggestionsClearRequested() {
        this.setState({
            suggestions: []
        })
    }

    renderSuggestion(suggestion) {
        return (
            <div className="suggestion">
                {(suggestion.render ? suggestion.render : () => suggestion.label)()}
            </div>
        )
    }
 
    render() {
        const {options, onChange, ...props} = this.props
        const filterOptions = createFilterOptions({ options: options })
        const onSuggestionsFetchRequested = ({ value }) => {
            this.setState({
                suggestions: value.trim() ? filterOptions(options, value) : options
            })
        }
 
        const inputProps = Object.assign({
            value: this.props.value,
            onChange: (e, { newValue }) => onChange(newValue)
        }, props)

        if (typeof inputProps.value !== 'string')
            inputProps.value = ''

        return (
            <div className="autosuggest">
                <Autosuggest
                    ref={this.autosuggest}
                    suggestions={this.state.suggestions}
                    onSuggestionsFetchRequested={onSuggestionsFetchRequested}
                    onSuggestionsClearRequested={this.onSuggestionsClearRequested}
                    getSuggestionValue={suggestion => suggestion.value}
                    renderSuggestion={this.renderSuggestion}
                    inputProps={inputProps}
                    shouldRenderSuggestions={() => true} />
                <div className="autosuggest-clear" onClick={this.onClear}></div>
            </div>
        )
    }
}

export default AutosuggestWrapper
