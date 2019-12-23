import React, { Component } from 'react'
import Centered from './Containers/Centered.jsx'

export default class NotFound extends Component {
    render() {
        return <Centered>
            <div className="not-found-title">404</div>
            <div className="caption">Try a different page, or click the logo to go back to the homepage</div>
        </Centered>
    }
}
