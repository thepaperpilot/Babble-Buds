import React, { Component } from 'react'
import { connect } from 'react-redux'
import Scrollbar from 'react-custom-scroll'
import Header from '../inspector/Header'
import RoomStatus from './RoomStatus'
import UsersList from './UsersList'
import { DISCONNECTED, CONNECTED } from '../../redux/networking'

import './multiplayer.css'

class Multiplayer extends Component {
    constructor(props) {
        super(props)

        this.openDiscord = this.openDiscord.bind(this)
    }

    openDiscord() {
        window.require('electron').shell.openExternal('https://discord.gg/WzejVAx')
    }

    render() {
        const connectionStatus = this.props.connectionStatus

        return (
            <div className="panel">
                <div className="inspector">   
                    <Header targetName="Multiplayer" />
                    <div className="inspector-content">
                        <Scrollbar allowOuterScroll={true} heightRelativeToParent="100%">
                            <RoomStatus />
                            {connectionStatus === CONNECTED ? <UsersList /> : null}
                        </Scrollbar>
                    </div>
                    {connectionStatus === DISCONNECTED ? <div className="panel-footer">
                        <p>Looking for Group?</p>
                        <p>Try the <button onClick={this.openDiscord}>Babble Buds Discord server!</button></p>
                    </div> : null}
                </div>
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        connectionStatus: state.networking.connectionStatus
    }
}

export default connect(mapStateToProps)(Multiplayer)
