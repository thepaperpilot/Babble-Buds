import React, { Component } from 'react'
import { connect } from 'react-redux'
import Foldable from '../ui/Foldable'
import { emit } from '../../redux/networking'
import cx from 'classnames'

class UsersList extends Component {
    constructor(props) {
        super(props)

        this.promote = this.promote.bind(this)
        this.changeHost = this.changeHost.bind(this)
        this.kick = this.kick.bind(this)
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

    render() {
        const { connectedUsers, connectedRoom, self, actors } = this.props
        const selfActor = connectedUsers.find(user => user.id === self)
        const isAdmin = connectedRoom && selfActor && selfActor.isAdmin
        const isHost = connectedRoom && selfActor && selfActor.isHost

        return <div className="action multiplayer-users">
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
                                const actor = actors.find(actor => actor.id === id)
                                return <div key={actor.id} className="char selector">
                                    <div className="desc">{actor.character.name}</div>
                                    <div className="uri-thumbnail" style={{ backgroundImage: actor.thumbnail }} />
                                </div>
                            })}
                        </div>
                    </div>
                })}
            </Foldable>
        </div>
    }
}

function mapStateToProps(state) {
    return {
        connectedUsers: state.networking.connectedUsers,
        connectedRoom: state.networking.connectedRoom,
        self: state.networking.self,
        actors: state.actors
    }
}

export default connect(mapStateToProps)(UsersList)
