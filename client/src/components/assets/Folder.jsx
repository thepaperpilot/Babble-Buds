import React, {Component} from 'react'
import { connect } from 'react-redux'
import InlineEdit from './../ui/InlineEdit'
import { ContextMenuTrigger } from 'react-contextmenu'
import { renameFolder } from '../../redux/project/folders'

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
        this.props.dispatch(renameFolder(this.props.tab, name))
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

export default connect(null, null, null, { withRef: true })(Folder)
