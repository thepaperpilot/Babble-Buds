import React, { Component } from 'react'
import AnimateHeight from 'react-animate-height'
import './dropdown.css'

class Dropdown extends Component {
    static uniqueId = 0

    constructor(props) {
        super(props)

        this.state = {
            id: Dropdown.uniqueId++,
            folded: true
        }

        this.toggleFolded = this.toggleFolded.bind(this)
    }

    toggleFolded() {
        this.setState({
            folded: !this.state.folded
        })
    }

    render() {
        return this.props.items.length ? (
            <div>
                <input
                    className="dropdown bar-dropdown"
                    type="checkbox"
                    id={`dropdown ${this.state.id}`}
                    checked={!this.state.folded}
                    onChange={this.toggleFolded} />
                <label htmlFor={`dropdown ${this.state.id}`}>
                    <div className="dropdown-content">
                        <AnimateHeight duration={0} height={this.state.folded ? '0%' : 'auto'}>
                            <ul>
                                {this.props.items.map((item, index) => (
                                    <li key={index} onClick={item.onClick}>{item.label}</li>
                                ))}
                            </ul>
                        </AnimateHeight>
                    </div>
                </label>
                {!this.state.folded && 
                    <div className="backdrop" onClick={this.toggleFolded} onContextMenu={this.toggleFolded}></div>}
            </div>
        ) : null
    }
}

export default Dropdown
