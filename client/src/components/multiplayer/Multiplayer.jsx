import React, { Component } from 'react'
import { connect } from 'react-redux'
import Scrollbar from 'react-custom-scroll'
import Header from '../inspector/Header'
import Foldable from '../ui/Foldable'
import Text from '../inspector/fields/Text'
import { setRoomName, setRoomPassword } from '../../redux/project/settings/networking'
import { connectToRoom, disconnect, banish, emit } from '../../redux/networking'
import cx from 'classnames'

import './multiplayer.css'

class Multiplayer extends Component {
    constructor(props) {
        super(props)

        this.changeRoomName = this.changeRoomName.bind(this)
        this.changeRoomPassword = this.changeRoomPassword.bind(this)
        this.connectToRoom = this.connectToRoom.bind(this)
        this.setSinglePlayer = this.setSinglePlayer.bind(this)
        this.banish = this.banish.bind(this)
        this.promote = this.promote.bind(this)
        this.changeHost = this.changeHost.bind(this)
        this.kick = this.kick.bind(this)
        this.openDiscord = this.openDiscord.bind(this)
    }

    changeRoomName(roomName) {
        this.props.dispatch(setRoomName(roomName))
    }

    changeRoomPassword(roomPassword) {
        this.props.dispatch(setRoomPassword(roomPassword))
    }

    connectToRoom() {
        this.props.dispatch(connectToRoom())
    }

    setSinglePlayer() {
        disconnect()
    }

    banish() {
        this.props.dispatch(banish())
    }

    promote(id) {
        return () => this.props.dispatch(emit('promote user', id))
    }

    changeHost(id) {
        return () => this.props.dispatch(emit('change host', id))
    }

    kick(id) {
        return () => this.props.dispatch(emit('kick user', id))
    }

    openDiscord() {
        window.require('electron').shell.openExternal('https://discord.gg/WzejVAx')
    }

    render() {
        const {isConnected, roomName, roomPassword, connectedUsers, connectedRoom, self} = this.props
        const selfActor = connectedUsers.find(user => user.id === self)
        const isAdmin = connectedRoom && selfActor && selfActor.isAdmin
        const isHost = connectedRoom && selfActor && selfActor.isHost
        return (
            <div className="panel">
                <div className="inspector">   
                    <Header targetName="Multiplayer" />
                    <div className="inspector-content">
                        <Scrollbar allowOuterScroll={true} heightRelativeToParent="100%">
                            {connectedRoom ? <div className="action">
                                <Foldable title="Room status">
                                    <Text title="Room Name" value={roomName} disabled={true} />
                                    {isHost ? <Text title="Room Password" value={roomPassword} onChange={this.changeRoomPassword} /> : null}
                                    <button onClick={this.setSinglePlayer}>{isHost ? 'Close' : 'Leave'} Room</button>
                                    {isAdmin ? <button onClick={this.banish}>Move all puppets off the stage</button> : null}
                                </Foldable>
                            </div> : null}
                            {!connectedRoom ? <div className="action">
                                <Foldable title="Join or Create Room">
                                    <Text title="Room Name" value={roomName} onChange={this.changeRoomName} disabled={isConnected} />
                                    <Text title="Room Password" value={roomPassword} onChange={this.changeRoomPassword} disabled={isConnected} />
                                    <button onClick={this.connectToRoom}>{isConnected ? 'Cancel' : 'Join/Create Room'}</button>
                                </Foldable>
                            </div> : null}
                            {connectedRoom ? <div className="action multiplayer-users">
                                <Foldable title="Connected Users">
                                    {connectedUsers.map(user => {
                                        const className = cx({
                                            field: true,
                                            host: user.isHost,
                                            admin: user.isAdmin
                                        })
                                        return <div key={user.id} className={className}>
                                            <div className={cx({ 'field-title': true, self: user.id === self })}>{user.nickname}</div>
                                            <div className="multiplayer-actors">
                                                {isAdmin && (!user.isAdmin || isHost) && !user.isHost ? <div className="user-actions">
                                                    {isHost ?
                                                        <button onClick={this.changeHost(user.id)}>
                                                            ♔ Make Host
                                                        </button> : null}
                                                    {isHost ?
                                                        <button onClick={this.promote(user.id)}>
                                                            ♗ {user.isAdmin ? 'Demote' : 'Promote'}
                                                        </button> : null}
                                                    <button className="kick" onClick={this.kick(user.id)}>Kick User</button>
                                                </div> : null}
                                                {user.actors.map(id => {
                                                    const actor = this.props.actors.find(actor => actor.id === id)
                                                    return <div key={actor.id} className="char selector">
                                                        <div className="desc">{actor.character.name}</div>
                                                        <div className="uri-thumbnail" style={{ backgroundImage: actor.thumbnail }} />
                                                    </div>
                                                })}
                                            </div>
                                        </div>
                                    })}
                                </Foldable>
                            </div> : null}
                        </Scrollbar>
                    </div>
                    {connectedRoom ? null : <div className="panel-footer">
                        <p>Looking for Group?</p>
                        <p>Try the <button onClick={this.openDiscord}>Babble Buds Discord server!</button></p>
                    </div>}
                </div>
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        isConnected: state.networking.isConnected,
        roomName: state.project.settings.networking.roomName,
        roomPassword: state.project.settings.networking.roomPassword,
        connectedUsers: state.networking.connectedUsers,
        connectedRoom: state.networking.connectedRoom,
        self: state.networking.self,
        actors: state.actors
    }
}

export default connect(mapStateToProps)(Multiplayer)
