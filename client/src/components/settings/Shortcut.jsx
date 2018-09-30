import React, {Component} from 'react'
import './shortcut.css'

const isAccelerator = window.require('electron-is-accelerator')

const modifierKeys = [
    16, // Shift
    17, // Control
    18, // Alt
    91  // Super (Win, Command)
]

const charMap = {
    '+': 'Plus',
    ' ': 'Space',
    'ArrowUp': 'Up',
    'ArrowDown': 'Down',
    'ArrowLeft': 'Left',
    'ArrowRight': 'Right'
}

class Shortcut extends Component {
    constructor(props) {
        super(props)

        this.state = {
            active: false
        }

        this.onKeypress = this.onKeypress.bind(this)
        this.onClick = this.onClick.bind(this)
        this.onBlur = this.onBlur.bind(this)
    }

    onKeypress(e) {
        if (!this.state.active) return
        if (modifierKeys.includes(e.keyCode)) return
        e.preventDefault()

        let key = e.key.length === 1 ? e.key.toUpperCase() : e.key
        if (key in charMap)
            key = charMap[key]
        if (e.shiftKey)
            key = `Shift+${key}`
        if (e.ctrlKey)
            key = `Ctrl+${key}`
        if (e.altKey)
            key = `Alt+${key}`
        if (e.metaKey)
            key = `Super+${key}`
        if (isAccelerator(key))
            this.props.onChange(key)
        
        this.setState({
            active: false
        })
    }

    onClick() {
        this.setState({
            active: !this.state.active
        })
    }

    onBlur() {
        this.setState({
            active: false
        })
    }

    render() {
        const value = this.state.active ?
            'Waiting for input' :
            this.props.value || ''
        return (
            <div className="field">                
                <p className="field-title">{this.props.title}</p>
                <div className="shortcut">
                    <input
                        type="text"
                        placeholder="Not bound"
                        value={value}
                        onKeyDown={this.onKeypress}
                        onClick={this.onClick}
                        onBlur={this.onBlur} />
                    <button onClick={() => this.props.onChange(null)}>
                    X
                    </button>
                </div>
            </div>
        )
    }
}

export default Shortcut
