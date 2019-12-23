import React, { Component } from 'react'
import Scrollbar from 'react-custom-scroll'
import Section from '../Containers/Section.jsx'
 
export default class ConnectionsList extends Component {
    render() {
        const connections = this.props.connections
        return <Section title="Active Connections">
            <div className="full-section console roomList">
                <Scrollbar allowOuterScroll={true} heightRelativeToParent="100%" 
                    keepAtBottom={true}>
                    {Object.keys(connections).map(id => {
                        return <pre key={id}>
                            {id}
                            <div style={{ float: 'right' }}>{connections[id]}</div>
                        </pre>
                    })}
                </Scrollbar>
            </div>
        </Section>
    }
}
