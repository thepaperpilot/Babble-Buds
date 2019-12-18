import React, {PureComponent} from 'react'
import { connect } from 'react-redux'
import classNames from 'classnames'
import { DropTarget, DragSource } from 'react-dnd'
import Scrollbar from 'react-custom-scroll'
import Folder from './Folder'
import { moveFolder, addFolder } from '../../redux/project/folders'
import { moveAsset } from '../../redux/project/assets/actions'
import './folderlist.css'

const assetTarget = {
    drop({ dispatch, tab}, monitor) {
        dispatch(moveAsset(monitor.getItem().id, tab))
    },
    canDrop: (props, monitor) => monitor.getItem().isOwned,
    hover: (item, monitor, thisItem) => {
        if (!thisItem.ref.current) {
            return
        }

        if (monitor.getItemType() !== 'folder')
            return

        const dragIndex = monitor.getItem().index
        const hoverIndex = item.index
        
        if (dragIndex === hoverIndex) {
            return
        }

        const hoverBoundingRect = thisItem.ref.current.getBoundingClientRect()
        
        const hoverMiddleY =
            (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
        
        const clientOffset = monitor.getClientOffset()
        
        const hoverClientY = clientOffset.y - hoverBoundingRect.top
        
        if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
            return
        }
        
        if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
            return
        }
        
        item.dispatch(moveFolder(dragIndex, hoverIndex))

        monitor.getItem().index = hoverIndex
    }
}

function collect(connect, monitor) {
    return {
        connectDropTarget: connect.dropTarget(),
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop()
    }
}

const folderSource = {
    beginDrag: ({ index }) => ({ index })
}

function collectSource(connect) {
    return {
        connectDragSource: connect.dragSource()
    }
}

export class FolderTarget extends PureComponent {
    constructor(props) {
        super(props)

        this.ref = React.createRef()

        this.jumpToFolder = this.jumpToFolder.bind(this)
    }

    jumpToFolder() {
        this.props.jumpToFolder(this.props.row)
    }

    render() {
        const { connectDragSource, connectDropTarget, isOver, canDrop, tab } = this.props
        return connectDragSource(connectDropTarget(<div className={classNames({
                'folder-list-item': true,
                isOver,
                canDrop
            })}
            onClick={this.jumpToFolder}
            ref={this.ref}>
            {/* For the actual object to render,
                we'll just copy our Folder component from the asset list */}
            <Folder contextmenu={this.props.contextmenu} tab={tab} />
        </div>))
    }
}

// Use some HOCs to give us our dispatch and other props
const ConnectedFolderTarget = DragSource('folder', folderSource, collectSource)(DropTarget(['asset', 'folder'], assetTarget, collect)(FolderTarget))

class NewFolderButton extends PureComponent {
    constructor(props) {
        super(props)

        this.newFolder = this.newFolder.bind(this)
    }

    newFolder() {
        let folder = 'New Asset Folder', i = 2
        while (this.props.tabs.includes(folder))
            folder = `New Asset Folder (${i++})`

        this.props.dispatch(addFolder(folder))
    }

    render() {
        return <button className="new-folder-button"
            onClick={this.newFolder}>+</button>
    }
}

function mapStateToProps(state) {
    return {
        tabs: state.project.folders
    }
}

const ConnectedNewFolderButton = connect(mapStateToProps)(NewFolderButton)

// The actual component we export is a list of all those folder targets
export default ({ tabs, jumpToFolder, tabToRow, CustomFolder, contextmenu }) => 
    <div className="folder-list">
        <Scrollbar allowOuterScroll={true} heightRelativeToParent="100%">
            {tabs.map((tab, i) => {
                const props = {
                    key: tab,
                    tab,
                    index: i,
                    contextmenu,
                    row: tabToRow[tab],
                    jumpToFolder
                }

                return CustomFolder ? <CustomFolder {...props} /> :
                    <ConnectedFolderTarget {...props} />})}
            {CustomFolder ? null : <ConnectedNewFolderButton />}
        </Scrollbar>
    </div>
