import React, { Component } from 'react'
import Scrollbar from 'react-custom-scroll'
import cx from 'classnames'
import Section from '../Containers/Section.jsx'
 
export default class UsersList extends Component {
    render() {
        const { users, actors } = this.props
        return <Section title="Connected Users">
            <div className="full-section console userList">
                <Scrollbar allowOuterScroll={true} heightRelativeToParent="100%" 
                    keepAtBottom={true}>
                    {Object.keys(users).map(id => {
                        const user = users[id]
                        const className = cx({
                            field: true,
                            host: user.isHost,
                            admin: user.isAdmin
                        })
                        return <div key={id} className={className}>
                            <div className="field-title">{user.nickname}</div>
                            <div className="multiplayer-actors">
                                {user.actors.map(id => {
                                    const actor = actors[Object.keys(actors).find(actorId => actorId === id)]
                                    console.log(id, actors)
                                    if (actor == null) return null
                                    return <div key={id} className="char selector">
                                        <div className="desc">{actor.character.name}</div>
                                        <div className="uri-thumbnail" style={{ backgroundImage: actor.thumbnail }} />
                                    </div>
                                })}
                            </div>
                        </div>
                    })}
                </Scrollbar>
            </div>
        </Section>
    }
}
