import React, {Component} from 'react'
import { connect } from 'react-redux'
import Scrollbar from 'react-custom-scroll'
import Header from './Header'
import Checkbox from './fields/Checkbox'
import Number from './fields/Number'
import Vector2 from './fields/Vector2'
import Text from './fields/Text'
import Slots from './fields/Slots'
import Dropdown from './../ui/Dropdown'
import Foldable from './../ui/Foldable'

class Layer extends Component {
    constructor(props) {
        super(props)

        this.changePosition = this.changePosition.bind(this)
        this.changeScale = this.changeScale.bind(this)
        this.changeLayer = this.changeLayer.bind(this)
        this.changeEmoteLayer = this.changeEmoteLayer.bind(this)
        this.deleteLayer = this.deleteLayer.bind(this)
    }

    changePosition(pos) {
        this.props.dispatch({
            type: 'EDIT_LAYER_POSITION',
            layer: this.props.target,
            pos
        })
    }

    changeScale(scale) {
        this.props.dispatch({
            type: 'EDIT_LAYER_SCALE',
            layer: this.props.target,
            scale
        })
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

    changeEmoteLayer(emote) {
        return value => {
            this.props.dispatch({
                type: 'EDIT_LAYER',
                layer: this.props.target,
                key: 'emoteLayer',
                value: value ? emote : 'base'
            })
        }
    }

    deleteLayer() {
        this.props.dispatch({
            type: 'DELETE_LAYER',
            layer: this.props.target
        })
    }

    render() {
        const dropdownItems = [
            { label: 'Delete Layer', onClick: this.deleteLayer }
        ]

        let layer = this.props.character.layers
        this.props.target.forEach(index => {
            if (layer == null || layer.children == null) return
            layer = layer.children[index]
        })
        if (layer == null) return null
        const inherit = layer.inherit
        const asset = layer.id ? this.props.assets[layer.id] : null
        const emoteLayer = inherit.emoteLayer || layer.emoteLayer

        const emotes = []
        const reducer = layer => {
            if (layer.emote != null)
                emotes.push(layer.emote)
            if (layer.children)
                layer.children.forEach(reducer)
        }
        this.props.character.layers.children.forEach(reducer)

        const emote = inherit.emote == null ? layer.emote : inherit.emote
        const emoteSlotDisabled = slot => 'emote' in inherit ||
            (emotes.includes(slot) && slot !== emote)

        return (
            <div className="inspector">
                <Header targetName={layer.name || asset.name} />
                <Dropdown items={dropdownItems}/>
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
                        {asset == null || <div className="action">
                            <Foldable title="Transform">
                                <Vector2
                                    title="Position"
                                    value={[layer.x, -layer.y]}
                                    onChange={this.changePosition} />
                                <Vector2
                                    title="Scale"
                                    value={[layer.scaleX, layer.scaleY]}
                                    onChange={this.changeScale} />
                                <Number
                                    title="Rotation"
                                    value={layer.rotation || 0}
                                    float={true}
                                    step={0.1}
                                    onChange={this.changeLayer('rotation')} />
                            </Foldable>
                        </div>}
                        <div className="action">
                            <Foldable title="Emote">
                                {asset != null && inherit.emote == null && layer.emote != null &&
                                    <pre className="info">
                                        It's not recommended to make individual assets emotes
                                    </pre>}
                                <Slots
                                    title="Emote"
                                    rows={3}
                                    cols={4}
                                    value={inherit.emote == null ? layer.emote : inherit.emote}
                                    onChange={this.changeLayer('emote')}
                                    disabled={emoteSlotDisabled} />
                            </Foldable>
                        </div>
                        <div className="action">
                            <Foldable title="Babble">
                                <Checkbox
                                    title="Head"
                                    value={layer.head || inherit.head}
                                    onChange={this.changeLayer('head')}
                                    disabled={'head' in inherit}
                                    help="Toggles whether or not this layer will bobble, if the bobble head option on the puppet is enabled" />
                                <Checkbox
                                    title="Eyes"
                                    value={emoteLayer === 'eyes'}
                                    onChange={this.changeEmoteLayer('eyes')}
                                    disabled={'emoteLayer' in inherit}
                                    help="Toggles whether or not this layer will appear as the puppet's eyes whilst the puppet is babbling" />
                                <Checkbox
                                    title="Mouth"
                                    value={emoteLayer === 'mouth'}
                                    onChange={this.changeEmoteLayer('mouth')}
                                    disabled={'emoteLayer' in inherit}
                                    help="Toggles whether or not this layer will appear as the puppet's mouth whilst the puppet is babbling" />
                            </Foldable>
                        </div>
                    </Scrollbar>
                </div>
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        assets: state.project.assets,
        character: state.editor.character
    }
}

export default connect(mapStateToProps)(Layer)
