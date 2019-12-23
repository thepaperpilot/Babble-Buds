import React, { Component } from 'react'
 
export default class Centered extends Component {
    render() {
        return <div className="centered-wrapper">
            <div className="centered">
                {this.props.children}
            </div>
        </div>
    }
}
