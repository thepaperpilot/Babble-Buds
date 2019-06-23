import React, {PureComponent} from 'react'
import { connect } from 'react-redux'
import { DropTarget } from 'react-dnd'
import Scrollbar from 'react-custom-scroll'
import Folder from './Folder'
import './folderlist.css'

const assetTarget = {
    drop({ dispatch, tab }, monitor) {
        dispatch({
            type: 'MOVE_ASSET',
            asset: monitor.getItem().id,
            tab
        })
    },
    canDrop: (props, monitor) => monitor.getItem().isOwned
}

function collect(connect, monitor) {
    return {
        connectDropTarget: connect.dropTarget(),
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop()
    }
}

class FolderTarget extends PureComponent {
    constructor(props) {
        super(props)

        this.jumpToFolder = this.jumpToFolder.bind(this)
    }

    jumpToFolder() {
        this.props.jumpToFolder(this.props.row)
    }

    render() {
        const { connectDropTarget, isOver, canDrop, tab } = this.props
        return connectDropTarget(<div className="folder-list-item"
            onClick={this.jumpToFolder}
            style={{
                // Set background color based on the current drop status
                backgroundColor: isOver && canDrop ? 'rgba(0, 255, 0, .2)' :
                    canDrop ? 'rgba(0, 255, 0, .05)' : ''
            }}>
            {/* For the actual object to render,
                we'll just copy our Folder component from the asset list */}
            <Folder tab={tab} />
        </div>)
    }
}

// Use some HOCs to give us our dispatch and other props
const ConnectedFolderTarget = connect()(DropTarget('asset', assetTarget, collect)(FolderTarget))

// The actual component we export is a list of all those folder targets
export default ({ tabs, jumpToFolder, tabToRow }) => <div className="folder-list">
    <Scrollbar allowOuterScroll={true} heightRelativeToParent="100%">
        {tabs.map(tab => <ConnectedFolderTarget
            key={tab} tab={tab}
            row={tabToRow[tab]}
            jumpToFolder={jumpToFolder} />)}
    </Scrollbar>
</div>
