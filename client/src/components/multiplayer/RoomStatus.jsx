import React, { Component } from 'react'
import { connect } from 'react-redux'
import Foldable from '../ui/Foldable'
import Text from '../inspector/fields/Text'
import Select from '../inspector/fields/Select'
import Puppet from '../inspector/fields/Puppet'
import {
    setRoomName, setRoomPassword,
    setAddAssetPermission, setDefaultPuppet,
    ANYONE, ADMINS_ONLY, HOST_ONLY
} from '../../redux/project/settings/networking'
import {
    connectToRoom, disconnect, banish,
    DISCONNECTED, CONNECTING, CONNECTED
} from '../../redux/networking'
import { saveAddress } from '../../redux/settings'

class RoomStatus extends Component {
    constructor(props) {
        super(props)

        this.changeRoomName = this.changeRoomName.bind(this)
        this.changeRoomPassword = this.changeRoomPassword.bind(this)
        this.changeAddAssetPermission = this.changeAddAssetPermission.bind(this)
        this.changeDefaultPuppet = this.changeDefaultPuppet.bind(this)
        this.connectToRoom = this.connectToRoom.bind(this)
        this.setSinglePlayer = this.setSinglePlayer.bind(this)
        this.banish = this.banish.bind(this)
    }

    setAddress(address) {
        this.props.dispatch(saveAddress(address))
    }

    changeRoomName(roomName) {
        this.props.dispatch(setRoomName(roomName))
    }

    changeRoomPassword(roomPassword) {
        this.props.dispatch(setRoomPassword(roomPassword))
    }

    changeAddAssetPermission(permission) {
        this.props.dispatch(setAddAssetPermission(permission))
    }

    changeDefaultPuppet(puppet) {
        this.props.dispatch(setDefaultPuppet(puppet))
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

    render() {
        const {
            connectionStatus, roomName, roomPassword,
            addAssetPermission, defaultPuppet,
            connectedUsers, connectedRoom, self, address
        } = this.props
        const selfActor = connectedUsers.find(user => user.id === self)
        const isAdmin = connectedRoom && selfActor && selfActor.isAdmin
        const isHost = connectedRoom && selfActor && selfActor.isHost

        if (connectionStatus === CONNECTED) {
            return <div className="action">
                <Foldable title="Room status">
                    <Text title="Room Name" value={roomName} disabled={true} />
                    {isHost ? <Text title="Room Password" value={roomPassword} onChange={this.changeRoomPassword} /> : null}
                    <button onClick={this.setSinglePlayer}>{isHost ? 'Close' : 'Leave'} Room</button>
                    {isAdmin ? <button onClick={this.banish}>Move all puppets off the stage</button> : null}
                </Foldable>
            </div>
        } else {
            const permissionOptions = [
                { label: 'Anyone', value: ANYONE },
                { label: 'Admins Only', value: ADMINS_ONLY },
                { label: 'Host Only', value: HOST_ONLY }
            ]
            return <div className="action">
                <Foldable title="Host Room">
                    <Text title="Server Address" value={address} onChange={this.setAddress} />
                    <Text title="Name" value={roomName} onChange={this.changeRoomName} disabled={connectionStatus !== DISCONNECTED} />
                    <Text title="Password" value={roomPassword} onChange={this.changeRoomPassword} disabled={connectionStatus !== DISCONNECTED} />
                    <Select title="Who can add assets" value={addAssetPermission} onChange={this.changeAddAssetPermission} options={permissionOptions} />
                    <Puppet title="Default puppet" value={defaultPuppet} onChange={this.changeDefaultPuppet} />
                    <button onClick={this.connectToRoom}>{connectionStatus === CONNECTING ? 'Cancel' : 'Create Room'}</button>
                </Foldable>
            </div>
        }
    }
}

function mapStateToProps(state) {
    return {
        address: state.settings.address,
        connectionStatus: state.networking.connectionStatus,
        roomName: state.project.settings.networking.roomName,
        roomPassword: state.project.settings.networking.roomPassword,
        addAssetPermission: state.project.settings.networking.addAssetPermission,
        defaultPuppet: state.project.settings.networking.defaultPuppet,
        connectedUsers: state.networking.connectedUsers,
        connectedRoom: state.networking.connectedRoom,
        self: state.networking.self
    }
}

export default connect(mapStateToProps)(RoomStatus)
