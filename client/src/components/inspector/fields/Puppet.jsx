import React, {Component} from 'react'
import { connect } from 'react-redux'
import Autosuggest from 'react-autosuggest'
import { DropTarget } from 'react-dnd'
import './select.css'
import './puppet.css'

class Puppet extends Component {
    constructor(props) {
        super(props)

        // I get the feeling some people won't like that I do this:
        this.state = this.componentWillReceiveProps(props)

        this.inputField = React.createRef()

        this.renderSuggestion = this.renderSuggestion.bind(this)
        this.renderInputComponent = this.renderInputComponent.bind(this)
    }

    componentWillReceiveProps(props) {        
        let options = []
        Object.keys(props.puppets).forEach(puppet => {
            if (!options.includes(puppet))
                options.push(puppet)
        })

        options = options.map(option => ({
            label: props.puppets[option].name,
            value: option,
            thumbnail: props.puppetThumbnails[option]
        }))

        const state = {
            options,
            selected: options.find(option => option.value === props.value)
        }

        if (this.state)
            this.setState(state)
        return state
    }

    renderSuggestion(suggestion, data) {
        return <div className="smallThumbnail-wrapper">
            <div className="smallThumbnail-img" style={{width: '20px', height: '20px'}}>
                <img
                    alt={suggestion.label}
                    src={suggestion.thumbnail}
                    draggable={false} />
            </div>
            <div className="smallThumbnail-label">{suggestion.label}</div>
        </div>
    }

    renderInputComponent(props) {
        props.onChange = e => e.preventDefault()
        return (
            <div className="input-thumbnail" onMouseDown={() => {
                if (this.inputField.current.state.isFocused)
                    this.justSelectedSuggestion = true
            }} onMouseUp={() => {
                if (this.justSelectedSuggestion) {
                    this.justSelectedSuggestion = false
                    setTimeout(() => {
                        this.inputField.current.input.blur()
                    })
                }
            }}>
                <div className="input-wrapper">
                    {this.state.selected == null ?
                        <div className="placeholder">Select one...</div> :
                        <div className="smallThumbnail-wrapper">
                            <div className="smallThumbnail-img" style={{width: '20px', height: '20px'}}>
                                <img
                                    alt={this.state.selected.label}
                                    src={this.state.selected.thumbnail}
                                    draggable={false} />
                            </div>
                            <div className="smallThumbnail-label">{this.state.selected.label}</div>
                        </div>
                    }
                </div>
                <input ref={this.inputComponent} {...props} />
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
                {this.props.connectDropTarget(<div style={{
                    borderRadius: '5px',
                    backgroundColor: this.props.isOver ? 'rgba(0, 255, 0, .2)' :
                        this.props.canDrop ? 'rgba(0, 255, 0, .05)' : ''
                }}>
                    <Autosuggest
                        ref={this.inputField}
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
                </div>)}
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        puppets: state.project.characters,
        puppetThumbnails: state.project.characterThumbnails
    }
}

const puppetTarget = {
    drop(props, monitor) {
        props.onChange(monitor.getItem().puppet)
    }
}

function collect(connect, monitor) {
    return {
        connectDropTarget: connect.dropTarget(),
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop()
    }
}

export default connect(mapStateToProps)(DropTarget(['puppet'], puppetTarget, collect)(Puppet))
