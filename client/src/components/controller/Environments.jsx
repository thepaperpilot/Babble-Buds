import React, {Component} from 'react'
import Environment from './Environment'
import EnvironmentContextMenu from './EnvironmentContextMenu'
import './controller.css'

class Environments extends Component {
    render() {
        const LinkedEnvironmentContextMenu = EnvironmentContextMenu(this.props.id)
        return <div className="controller-container">
            <LinkedEnvironmentContextMenu />
            <div className="flex-column">
                {[0,1,2].map(n => (
                    <div key={n} className="flex-row">
                        {[0,1,2].map(i => <Environment contextmenu={this.props.id}
                            index={3 * n + i} key={3 * n + i} />)}
                    </div>
                ))}
            </div>
        </div>
    }
}

export default Environments
