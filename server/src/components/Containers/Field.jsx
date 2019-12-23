import React, { Component } from 'react'
 
export default class Field extends Component {
    render() {
        return <div className="field">
            <div className="field-title">{this.props.title}</div>
            {this.props.children}
        </div>
    }
}
