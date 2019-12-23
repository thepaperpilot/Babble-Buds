import React, { Component } from 'react'
import Centered from './Containers/Centered.jsx'
import RoomList from './Admin/RoomList.jsx'
import ConnectionsList from './Admin/ConnectionsList.jsx'
import StatusLog from './Admin/StatusLog.jsx'
import StagePreview from './Admin/StagePreview.jsx'
import CloseRoomButton from './Admin/CloseRoomButton.jsx'
import UsersList from './Admin/UsersList.jsx'
import LoginSection from './Admin/LoginSection.jsx'

export default class Admin extends Component {
    constructor(props) {
        super(props)

        this.state = {
            loggedIn: false,
            socket: null,
            rooms: {},
            statusLog: [],
            selectedRoom: null,
            connections: {}
        }

        this.login = this.login.bind(this)
        this.selectRoom = this.selectRoom.bind(this)
    }

    componentDidMount() {
        const socket = io()
        this.setState({ socket })
        socket.on('loginSuccess', this.login)
        socket.on('log', log => this.setState({ statusLog: [...this.state.statusLog, log] }))
        socket.on('add room', (name, room) => this.setState({ rooms: { ...this.state.rooms, [name]: room } }))
        socket.on('remove room', name => {
            const { [name]: removed, ...rooms } = this.state.rooms
            this.setState({ rooms, selectedRoom: this.state.selectedRoom === name ? null : this.state.selectedRoom })
        })
        socket.on('update room', (name, room) => this.setState({
            rooms: { ...this.state.rooms, [name]: Object.assign({}, this.state.rooms[name], room) }
        }))
        socket.on('update puppet', (name, id, puppet) => this.setState({
            rooms: {
                ...this.state.rooms,
                [name]: {
                    ...this.state.rooms[name],
                    puppets: {
                        ...this.state.rooms[name].puppets,
                        [id]: Object.assign({}, this.state.rooms[name].puppets[id], puppet)
                    }
                }
            }
        }))
        socket.on('add connection', id => this.setState({ connections: { ...this.state.connections, [id]: '' } }))
        socket.on('remove connection', id => {
            const { [id]: removed, ...connections } = this.state.connections
            this.setState({ connections })
        })
        socket.on('update connection', (id, room) => this.setState({
            connections: { ...this.state.connections, [id]: room }
        }))
    }

    componentWillUnmount() {
        this.state.socket.close()
    }

    login({ rooms, statusLog, connections }) {
        this.setState({ loggedIn: true, rooms, statusLog, connections })
    }

    selectRoom(name) {
        return () => {
            this.setState({
                selectedRoom: this.state.selectedRoom === name ? '' : name
            })
        }
    }

    render() {
        if (this.state.socket == null) return <Centered>Connecting...</Centered>

        if (this.state.loggedIn) {
            const { rooms, statusLog, selectedRoom, connections } = this.state
            return <div className="admin-console">
                <div className="section-container">
                    <RoomList rooms={rooms} selectedRoom={selectedRoom} selectRoom={this.selectRoom} />
                    <ConnectionsList connections={connections} />
                </div>
                <StatusLog statusLog={statusLog} selectedRoom={selectedRoom} />
                {selectedRoom && <div className="section-container">
                    <StagePreview room={rooms[selectedRoom]} />
                    <CloseRoomButton socket={this.state.socket} selectedRoom={selectedRoom} />
                    <UsersList socket={this.state.socket} users={rooms[selectedRoom].users} actors={rooms[selectedRoom].puppets} />
                </div>}
            </div>
        } else {
            return <LoginSection socket={this.state.socket} />
        }
    }
}
