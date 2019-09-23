import React, {Component} from 'react'
import { connect } from 'react-redux'
import Scrollbar from 'react-custom-scroll'
import {Puppet} from 'babble.js'
import Header from './Header'
import AnimationSection from './AnimationSection'
import BabbleSection from './BabbleSection'
import EmoteSection from './EmoteSection'
import TransformSection from './TransformSection'
import Text from './fields/Text'
import Dropdown from './../ui/InspectorDropdown'
import Foldable from './../ui/Foldable'
import LayerContextMenu from './../layers/LayerContextMenu'

class Layer extends Component {
    constructor(props) {
        super(props)

        this.changeLayer = this.changeLayer.bind(this)
    }

    changeLayer(key) {
        return value => {
            this.props.dispatch({
                type: 'EDIT_LAYER',
                layer: this.props.target,
                key,
                value
            })
        }
    }

    render() {
        let layer = this.props.layers

        this.props.target.forEach(index => {
            if (layer == null || layer.children == null) return
            layer = layer.children[index]
        })
        if (layer == null) return null
        const inherit = layer.inherit
        const asset = layer.id ? this.props.assets[layer.id] : null
        const emoteLayer = inherit.emoteLayer || layer.emoteLayer

        const handleLayer = key => layer => {
            return layer[key] != null
        }

        // Intermediary between Puppet.handleLayer to skip the initial layer
        const finder = key => {
            if (layer.children)
                return layer.children.find(l => Puppet.handleLayer(this.props.assets, l, handleLayer(key)))
            else if (layer.id && this.props.assets[layer.id].type === 'bundle')
                return this.props.assets[layer.id].layers.children.find(l => Puppet.handleLayer(this.props.assets, l, handleLayer(key)))
            return false
        }

        const LinkedLayerContextMenu = LayerContextMenu(this.props.contextmenu)


        const isEnvironment = this.props.type === 'environment'

        return (
            <div className="inspector">
                <Header targetName={layer.name || asset.name} />
                <Dropdown menu={LinkedLayerContextMenu}
                    id={`contextmenu-layer-${this.props.contextmenu}`}
                    collect={() => ({
                        path: layer.path,
                        self: this.props.self,
                        name: layer.name,
                        layerChildren: layer.children,
                        tabs: this.props.folders,
                        assetId: layer.id,
                        asset: layer
                    })} />
                <div className="inspector-content">
                    <Scrollbar allowOuterScroll={true} heightRelativeToParent="100%">
                        <div className="action">
                            <Foldable title="General">
                                <Text
                                    title="Layer Name"
                                    value={layer.name}
                                    onChange={this.changeLayer('name')} />
                            </Foldable>
                        </div>
                        <TransformSection
                            layer={layer}
                            asset={asset}
                            target={this.props.target} />
                        {isEnvironment ? null : <EmoteSection
                            inherit={inherit}
                            layer={layer}
                            finder={finder}
                            asset={asset}
                            assets={this.props.assets}
                            layers={this.props.layers}
                            target={this.props.target} />}
                        {isEnvironment ? null : <BabbleSection
                            inherit={inherit}
                            layer={layer}
                            finder={finder}
                            emoteLayer={emoteLayer}
                            target={this.props.target} />}
                        <AnimationSection 
                            layer={layer}
                            target={this.props.target} />
                    </Scrollbar>
                </div>
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        assets: state.project.assets,
        folders: state.project.settings.folders,
        layers: state.editor.present.character.layers,
        type: state.editor.present.type,
        self: state.self
    }
}

export default connect(mapStateToProps)(Layer)
