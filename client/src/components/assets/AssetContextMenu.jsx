import React, {Component} from 'react'
import { connect } from 'react-redux'
import { ContextMenu, MenuItem, SubMenu, connectMenu } from 'react-contextmenu'

const MENU_TYPE = 'contextmenu-asset'

class AssetContextMenu extends Component {
    constructor(props) {
        super(props)

        this.newAssetTab = this.newAssetTab.bind(this)
        this.moveAsset = this.moveAsset.bind(this)
        this.duplicateAsset = this.duplicateAsset.bind(this)
        this.edit = this.edit.bind(this)
        this.deleteAsset = this.deleteAsset.bind(this)
    }

    newAssetTab() {
        let name = 'New Asset Folder', i = 2
        while (this.props.tabs.includes(name))
            name = `New Asset Folder (${i})`

        this.toFocus = name
        this.props.dispatch({
            type: 'MOVE_ASSET',
            asset: this.props.trigger.asset,
            tab: name
        })
    }

    moveAsset(tab) {
        return () => {
            this.props.dispatch({
                type: 'MOVE_ASSET',
                asset: this.props.trigger.asset,
                tab
            })
        }
    }

    duplicateAsset() {
        this.props.dispatch({
            type: 'DUPLICATE_ASSET',
            asset: this.props.trigger.asset
        })
    }

    edit() {
        if (this.props.trigger.inlineEdit.current)
            this.props.trigger.inlineEdit.current.getWrappedInstance().edit()
    }

    deleteAsset() {
        this.props.dispatch({
            type: 'DELETE_ASSET',
            asset: this.props.trigger.asset
        })
    }

    render() {
        return <ContextMenu id={MENU_TYPE}>
            <MenuItem onClick={this.duplicateAsset}>Duplicate</MenuItem>
            {this.props.trigger && this.props.trigger.disabled ? null : <React.Fragment>
                <SubMenu title="Move">
                    {this.props.tabs.map(tab =>
                        <MenuItem
                            onClick={this.moveAsset(tab)}
                            key={tab}>
                            {tab}
                        </MenuItem>
                    )}
                    <MenuItem divider />
                    <MenuItem onClick={this.newAssetTab}>New Folder</MenuItem>
                </SubMenu>
                <MenuItem onClick={this.edit}>Rename</MenuItem>
            </React.Fragment>}
            {/* TODO disable delete option when disabled AND in multiplayer */}
            <MenuItem onClick={this.deleteAsset}>Delete</MenuItem>
        </ContextMenu>
    }
}

export default connect()(connectMenu(MENU_TYPE)(AssetContextMenu))
