import React from 'react'
import { connect } from 'react-redux'
import Puppet from './Puppet'
import Layer from './Layer'
import './inspector.css'
import './action.css'
import './context-menu.css'

function mapStateToProps(state) {
    return {
        target: state.inspector.target,
        targetType: state.inspector.targetType
    }
}

export default connect(mapStateToProps)(props => {
    let content = null

    switch (props.targetType) {
    case 'puppet': content = <Puppet target={props.target} />; break
    case 'layer': content = <Layer target={props.target} />; break
    default:
        // TODO render a "not inspecting anything" screen
        break
    }
    return (
        <div className="panel">
            {content}
        </div>
    )
})
