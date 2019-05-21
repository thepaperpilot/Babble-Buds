import React, {Component} from 'react'
import { connect } from 'react-redux'
import { DropTarget } from 'react-dnd'
import InlineEdit from './../ui/InlineEdit'
import { ContextMenuTrigger } from 'react-contextmenu'

class Folder extends Component {
    constructor(props) {
        super(props)

        this.inlineEdit = React.createRef()

        this.focus = this.focus.bind(this)
        this.renameFolder = this.renameFolder.bind(this)
    }

    focus() {
        if (this.inlineEdit.current)
            this.inlineEdit.current.getWrappedInstance().edit()
    }

    renameFolder(name) {
        Object.keys(this.props.assets).filter(id =>
            this.props.assets[id].tab === this.props.tab).forEach(id => {
            const asset = this.props.assets[id]
            if (id.split(':')[0] === this.props.self) {
                this.props.dispatch({
                    type: 'MOVE_ASSET',
                    asset: id,
                    tab: name
                })
            } else {
                this.props.dispatch({
                    type: 'WARN',
                    content: `Unable to move asset "${asset.name}" because its owned by someone else. Please duplicate the asset and remove the original and try again.`
                })
            }
        })
    } 

    render() {
        return <ContextMenuTrigger
            attributes={{className: 'header-wrapper'}}
            collect={({ tab, inlineEdit }) => ({ tab, inlineEdit })}
            tab={this.props.tab}
            inlineEdit={this.inlineEdit}
            id="contextmenu-tab"
            holdToDisplay={-1}>
            {this.props.connectDropTarget(<div style={{
                backgroundColor: this.props.isOver ? 'rgba(0, 255, 0, .2)' :
                    this.props.canDrop ? 'rgba(0, 255, 0, .05)' : ''
            }}>
                <InlineEdit
                    ref={this.inlineEdit}
                    target={this.props.tab}
                    selectable={false}
                    onChange={this.renameFolder} />
            </div>)}
        </ContextMenuTrigger>
    }
}

const assetTarget = {
    drop(props, monitor) {
        props.dispatch({
            type: 'MOVE_ASSET',
            asset: monitor.getItem().asset,
            tab: props.tab
        })
    }
}

function collect(connect, monitor) {
    return {
        connectDropTarget: connect.dropTarget(),
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop()
    }
}

function mapStateToProps(state) {
    return {
        assets: state.project.assets,
        self: state.self
    }
}

export default DropTarget('asset', assetTarget, collect)(connect(mapStateToProps, null, null, { withRef: true })(Folder))
