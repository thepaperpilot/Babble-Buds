import React, {Component} from 'react'
import Character from './Character'

class Characters extends Component {
    render() {
        return (
            <div className="flex-column">
                {[0,1,2].map(n => (
                    <div key={n} className="flex-row">
                        {[0,1,2].map(i => <Character index={3 * n + i} key={3 * n + i} />)}
                    </div>
                ))}
            </div>
        )
    }
}

export default Characters
