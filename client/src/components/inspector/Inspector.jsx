import React from 'react'
import { connect } from 'react-redux'
import Puppet from './Puppet'
import Layer from './Layer'
import Emitter from './Emitter'
import Environment from './Environment'
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

    const childProps = {
        contextmenu: props.id
    }

    switch (props.targetType) {
    case 'puppet': content = <Puppet {...childProps} target={props.target} />; break
    case 'layer': content = <Layer {...childProps} target={props.target} />; break
    case 'emitter': content = <Emitter {...childProps} target={props.target} />; break
    case 'environment': content = <Environment {...childProps} target={props.target} />; break
    default: content = <div className="default">Select something to inspect</div>; break
    }
    return (
        <div className="panel">
            {content}
        </div>
    )
})
