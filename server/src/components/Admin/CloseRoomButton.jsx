import React, { Component } from 'react'
 
export default class CloseRoomButton extends Component {
    constructor(props) {
        super(props)

        this.closeRoom = this.closeRoom.bind(this)
    }

    closeRoom() {
        this.props.socket.emit('close room', this.props.selectedRoom)
    }

    render() {
        return <button onClick={this.closeRoom} className="large-button">Close Room</button>
    }
}
