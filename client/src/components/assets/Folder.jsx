import React, {Component} from 'react'
import { connect } from 'react-redux'
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
        this.props.folder.forEach(id => {
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
            collect={() => ({ tab: this.props.tab, inlineEdit: this.inlineEdit })}
            id={`contextmenu-tab-${this.props.contextmenu}`}
            holdToDisplay={-1}>
            <InlineEdit
                ref={this.inlineEdit}
                target={this.props.tab}
                selectable={false}
                onChange={this.renameFolder} />
        </ContextMenuTrigger>
    }
}

function mapStateToProps(state, props) {
    return {
        assets: state.project.assets,
        folder: props.tab ?
            state.project.settings.folders.find(f => f.name === props.tab).assets :
            [],
        self: state.self
    }
}

export default connect(mapStateToProps, null, null, { withRef: true })(Folder)
