import React, {Component} from 'react'
import { connect } from 'react-redux'
import {Puppet} from 'babble.js'
import Slots from './fields/Slots'
import Foldable from './../ui/Foldable'
import {calculateEmotes} from './../layers/Layers'

class EmoteSection extends Component {
    constructor(props) {
        super(props)

        this.selectEmote = this.selectEmote.bind(this)
        this.changeEmote = this.changeEmote.bind(this)
    }

    selectEmote(emote) {
        this.props.dispatch({
            type: 'SET_EDITOR_EMOTE',
            emote
        })
    }

    changeEmote(emote) {
        this.props.dispatch({
            type: 'EDIT_LAYER_EMOTE',
            layer: this.props.target,
            asset: this.props.asset,
            emote
        })
    }

    render() {
        const {
            inherit, layer, finder, asset, assets, layers
        } = this.props

        const emotes = calculateEmotes(assets, layers)
        const emote = inherit.emote == null ? layer.emote : inherit.emote
        const isBundle = asset && asset.type === 'bundle'

        const bundleEmotesWarning = isBundle &&
            asset.conflicts.emotes.length !== 0 && emote != null ?
            <pre className="error">
                This asset bundle has one or more emotes inside it, but this layer is already an emote!
            </pre> : null
        const bundleConflictWarning = isBundle && bundleEmotesWarning == null &&
            asset.conflicts.emotes.some(e => e in emotes && (emotes[e] !== layer || layer.emote === e)) ?
            <pre className="error">
                This asset bundle has emotes inside it that already exist in this puppet!
            </pre> : null
        const bundleEmotesInfo = isBundle && bundleEmotesWarning == null &&
            bundleConflictWarning == null && asset.conflicts.emotes.length !== 0 ?
            <pre className="info">
                This asset bundle has one or more emotes inside it. You can change which emote is currently visible in the Editor using these buttons. You'll need to edit the bundle itself to change what emotes are available. 
            </pre> : null

        const nestedEmoteWarning = 'emote' in inherit && layer.emote != null ?
            <pre className="error">
                {`Attempting to place emote '${layer.name}' (${layer.emote}) inside emote '${emotes[inherit.emote].name}' (${inherit.emote})!`}
            </pre> : null
        const emoteExistsWarning = layer.emote != null && layer.emote in emotes &&
            emotes[layer.emote] !== layer ?
            <pre className="error">
                {`Attempting to create emote '${layer.name}' (${layer.emote}) but emote with same id '${emotes[layer.emote].name}' already exists!`}
            </pre> : null

        const emoteSlotDisabled = slot => {
            if ('emote' in inherit) return false

            if (bundleEmotesInfo != null) {
                return !asset.conflicts.emotes.includes(slot) || !(slot in emotes)
            } else if (bundleEmotesWarning != null) {
                return slot !== emote
            } else {
                return (slot in emotes && slot !== emote) || finder('emote')
            }
        }

        const allEmotesDisabled = [...Array(12).keys()]
            .map(emoteSlotDisabled).every(b => b)

        return <div className="action">
            <Foldable title="Emote"
                classNames={{
                    warning: nestedEmoteWarning != null ||
                        emoteExistsWarning != null ||
                        bundleEmotesWarning != null ||
                        bundleConflictWarning != null
                }}
                defaultFolded={!isBundle && (asset != null || allEmotesDisabled)}
                state={[asset != null, allEmotesDisabled]}>
                {!isBundle && asset != null && inherit.emote == null &&
                    layer.emote != null &&
                    <pre className="info">
                        It's not recommended to make individual assets emotes
                    </pre>}
                {bundleEmotesInfo}
                {nestedEmoteWarning}
                {emoteExistsWarning}
                {bundleEmotesWarning}
                {bundleConflictWarning}
                <Slots
                    title="Emote"
                    rows={3}
                    cols={4}
                    value={bundleEmotesInfo != null ? this.props.emote :
                        layer.emote == null ? inherit.emote : layer.emote}
                    onChange={bundleEmotesInfo != null ? this.selectEmote :
                        this.changeEmote}
                    disabled={emoteSlotDisabled} />
            </Foldable>
        </div>
    }
}

export default connect()(EmoteSection)
