import React, {Component} from 'react'
import { connect } from 'react-redux'
import classNames from 'classnames'
import { ContextMenuTrigger } from 'react-contextmenu'
import { ActionCreators as UndoActionCreators } from 'redux-undo'

const join = require('path').join

// TODO make it so we can drag this layer into the assets panel to create asset bundles
class Layer extends Component {
    constructor(props) {
        super(props)

        this.onNodeClick = this.onNodeClick.bind(this)
        this.editBundle = this.editBundle.bind(this)
    }

    onNodeClick() {
        this.props.dispatch({
            type: 'SELECT_LAYER',
            path: this.props.path
        })
    }

    editBundle() {
        if (this.props.asset && this.props.asset.type === 'bundle') {
            this.props.dispatch({
                type: 'EDIT_PUPPET',
                id: this.props.id,
                character: this.props.asset,
                objectType: 'asset'
            })
        }
    }

    render() {
        const {selected, asset, assetsPath, characterId} = this.props
        const {path, id, name, children, nodeEmote, emotes, head, emoteLayer, inherit, tabs, self} = this.props
        
        // TODO menu item to "recenter layer", which will only work on a layer with children, and will move the parent layer's position
        // so that its at the center of where all its children are, and offset each child the opposite direction to compensate
        // Thus making scaling and rotating work in a more straightforward way
        const className = ['layer']
        if (JSON.stringify(selected) === JSON.stringify(path))
            className.push('selected')
        if ((inherit && 'emote' in inherit && nodeEmote != null) ||
            (nodeEmote != null && nodeEmote in emotes && JSON.stringify(emotes[nodeEmote].path) !== JSON.stringify(path)) ||
            (head != null && inherit && inherit.head != null) ||
            (emoteLayer != null && inherit && inherit.emoteLayer != null) ||
            (asset && asset.type === 'bundle' && id === characterId))
            className.push('warning')
        const emote = nodeEmote != null ?
            <div className={this.props.emote === nodeEmote ?
                'emote-layer visible' : 'emote-layer'} /> : null
        const bundle = asset && asset.type === 'bundle' ?
            <div className="asset-bundle" /> : null
        return <ContextMenuTrigger
            id={`contextmenu-layer-${this.props.contextmenu}`}
            holdToDisplay={-1}
            collect={() => ({ path, self, name, layerChildren: children, tabs, assetId: id, asset })}>
            <div className={classNames(className)}
                onClick={this.onNodeClick}
                onDoubleClick={this.editBundle}>
                {children == null ?
                    asset ?
                        <div>
                            <img src={join(assetsPath, `${asset.location}?version=${asset.version}`)}
                                alt={asset.name} />
                            {name}
                        </div> : null :
                    name ? <div>{name}</div> : <div>root</div>}
                {emote}
                {bundle}
            </div>
        </ContextMenuTrigger>
    }
}

function mapStateToProps(state, props) {
    return {
        characterId: state.editor.present.id,
        selected: state.editor.present.layer,
        asset: state.project.assets[props.id],
        emote: state.editor.present.emote,
        assetsPath: state.project.assetsPath,
        self: state.self
    }
}

export default connect(mapStateToProps)(Layer)
