import React, {Component} from 'react'
import Character from './Character'
import CharacterContextMenu from './CharacterContextMenu'
import './controller.css'

class Characters extends Component {
    render() {
        const LinkedCharacterContextMenu = CharacterContextMenu(this.props.id)
        return <div className="controller-container">
            <LinkedCharacterContextMenu />
            <div className="flex-column">
                {[0,1,2].map(n => (
                    <div key={n} className="flex-row">
                        {[0,1,2].map(i => <Character contextmenu={this.props.id}
                            index={3 * n + i} key={3 * n + i} />)}
                    </div>
                ))}
            </div>
        </div>
    }
}

export default Characters
