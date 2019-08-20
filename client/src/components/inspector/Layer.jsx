import React, {Component} from 'react'
import { connect } from 'react-redux'
import Scrollbar from 'react-custom-scroll'
import Header from './Header'
import Checkbox from './fields/Checkbox'
import Angle from './fields/Angle'
import Number from './fields/Number'
import Vector2 from './fields/Vector2'
import Text from './fields/Text'
import Slots from './fields/Slots'
import Dropdown from './../ui/InspectorDropdown'
import Foldable from './../ui/Foldable'
import LayerContextMenu from './../layers/LayerContextMenu'

class Layer extends Component {
    constructor(props) {
        super(props)

        this.changePosition = this.changePosition.bind(this)
        this.changeScale = this.changeScale.bind(this)
        this.changeLayer = this.changeLayer.bind(this)
        this.changeEmote = this.changeEmote.bind(this)
        this.changeEmoteLayer = this.changeEmoteLayer.bind(this)
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

    changeEmote(emote) {
        this.props.dispatch({
            type: 'EDIT_LAYER_EMOTE',
            layer: this.props.target,
            emote
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

    render() {
        let layer = this.props.character.layers

        this.props.target.forEach(index => {
            if (layer == null || layer.children == null) return
            layer = layer.children[index]
        })
        if (layer == null) return null
        const inherit = layer.inherit
        const asset = layer.id ? this.props.assets[layer.id] : null
        const emoteLayer = inherit.emoteLayer || layer.emoteLayer

        const emotes = {}
        const reducer = layer => {
            if (layer.emote != null && !(layer.emote in emotes))
                emotes[layer.emote] = layer
            if (layer.children)
                layer.children.forEach(reducer)
            else if (this.props.assets[layer.id].type === 'bundle')
                this.props.assets[layer.id].layers.children.forEach(reducer)
        }
        this.props.character.layers.children.forEach(reducer)

        const finder = (key, first) => layer => {
            if (layer[key] != null && !first)
                return true
            if (layer.children && layer.children.find(finder(key)))
                return true
            if (layer.id && this.props.assets[layer.id].type === 'bundle' && this.props.assets[layer.id].layers.children.find(finder(key)))
                return true
            return false
        }

        let nestedEmoteWarning = 'emote' in inherit && layer.emote != null ?
            <pre className="error">
                {`Attempting to place emote '${layer.name}' (${layer.emote}) inside emote '${emotes[inherit.emote].name}' (${inherit.emote})!`}
            </pre> : null
        let emoteExistsWarning = layer.emote != null && layer.emote in emotes && emotes[layer.emote] !== layer ?
            <pre className="error">
                {`Attempting to create emote '${layer.name}' (${layer.emote}) but emote with same id '${emotes[layer.emote].name}' already exists!`}
            </pre> : null

        const emote = inherit.emote == null ? layer.emote : inherit.emote
        const emoteSlotDisabled = slot => 'emote' in inherit ||
            (slot in emotes && slot !== emote) ||
            finder('emote', true)(layer)

        let nestedHeadWarning = 'head' in inherit && layer.head != null ?
            <pre className="error">
                Attempting to make this layer a head layer but it is already inside one.
            </pre> : null
        let nestedEmoteLayerWarning = 'emoteLayer' in inherit && layer.emoteLayer != null ?
            <pre className="error">
                {`Attempting to make this layer a${layer.emoteLayer === 'mouth' ? ' mouth' : 'n eyes'} layer but it is already inside a${inherit.emoteLayer === 'mouth' ? ' mouth' : 'n eyes'} layer.`}
            </pre> : null

        const emoteLayerDisabled = ('emoteLayer' in inherit || finder('emoteLayer', true)(layer)) && layer.emoteLayer == null
        const allEmotesDisabled = [...Array(12).keys()].map(emoteSlotDisabled).every(b => b)

        const LinkedLayerContextMenu = LayerContextMenu(this.props.contextmenu)

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
                        <div className="action">
                            <Foldable title="Transform" defaultFolded={asset == null} state={asset == null}>
                                {asset == null && <div className="info">
                                    Be cautious when transforming non-asset layers!
                                </div>}
                                <Vector2
                                    title="Position"
                                    value={[layer.x || 0, -layer.y || 0]}
                                    onChange={this.changePosition} />
                                <Vector2
                                    title="Scale"
                                    value={[layer.scaleX || 1, layer.scaleY || 1]}
                                    onChange={this.changeScale}
                                    float={true}
                                    step={.01} />
                                <Angle
                                    title="Rotation"
                                    value={layer.rotation}
                                    onChange={this.changeLayer('rotation')} />
                            </Foldable>
                        </div>
                        <div className="action">
                            <Foldable title="Emote"
                                classNames={{ warning: nestedEmoteWarning != null || emoteExistsWarning != null }}
                                defaultFolded={asset != null || allEmotesDisabled}
                                state={[asset != null, allEmotesDisabled]}>
                                {asset != null && inherit.emote == null && layer.emote != null &&
                                    <pre className="info">
                                        It's not recommended to make individual assets emotes
                                    </pre>}
                                {nestedEmoteWarning}
                                {emoteExistsWarning}
                                <Slots
                                    title="Emote"
                                    rows={3}
                                    cols={4}
                                    value={layer.emote == null ? inherit.emote : layer.emote}
                                    onChange={this.changeEmote}
                                    disabled={emoteSlotDisabled} />
                            </Foldable>
                        </div>
                        <div className="action">
                            <Foldable title="Babble" classNames={{ warning: nestedHeadWarning != null || nestedEmoteLayerWarning != null }}>
                                {nestedHeadWarning}
                                {nestedEmoteLayerWarning}
                                <Checkbox
                                    title="Head"
                                    value={layer.head || inherit.head}
                                    onChange={this.changeLayer('head')}
                                    disabled={('head' in inherit || finder('head', true)(layer)) && !layer.head}
                                    help="Toggles whether or not this layer will bobble, if the bobble head option on the puppet is enabled" />
                                <Checkbox
                                    title="Eyes"
                                    value={emoteLayer === 'eyes'}
                                    onChange={this.changeEmoteLayer('eyes')}
                                    disabled={emoteLayerDisabled}
                                    help="Toggles whether or not this layer may appear as the puppet's eyes whilst the puppet is babbling" />
                                <Checkbox
                                    title="Mouth"
                                    value={emoteLayer === 'mouth'}
                                    onChange={this.changeEmoteLayer('mouth')}
                                    disabled={emoteLayerDisabled}
                                    help="Toggles whether or not this layer may appear as the puppet's mouth whilst the puppet is babbling" />
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
        folders: state.project.settings.folders,
        character: state.editor.present.character,
        self: state.self
    }
}

export default connect(mapStateToProps)(Layer)
