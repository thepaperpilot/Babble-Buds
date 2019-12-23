import React, { Component } from 'react'
 
export default class Section extends Component {
    render() {
        return <div className="section">
            <div className="section-content">
                {this.props.title ? <div className="section-title">{this.props.title}</div> : null}
                {this.props.children}
            </div>
        </div>
    }
}
