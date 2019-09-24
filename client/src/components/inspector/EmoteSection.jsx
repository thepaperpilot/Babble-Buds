import React, {Component} from 'react'
import { connect } from 'react-redux'
import {Puppet} from 'babble.js'
import Slots from './fields/Slots'
import Foldable from './../ui/Foldable'

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
            emote
        })
    }

    render() {
        const {
            inherit, layer, finder, asset, assets, layers
        } = this.props

        const emotes = {}
        Puppet.handleLayer(assets, layers, layer => {
            if (layer.emote != null && !(layer.emote in emotes))
                emotes[layer.emote] = layer
        })
        
        const isBundle = asset && asset.type === 'bundle' ?
            <pre className="info">
                This asset bundle has multiple emotes inside it. You can change which emote is currently visible in the Editor using these buttons. You'll need to edit the bundle itself to change what emotes are available. 
            </pre> : null
        const nestedEmoteWarning = 'emote' in inherit && layer.emote != null ?
            <pre className="error">
                {`Attempting to place emote '${layer.name}' (${layer.emote}) inside emote '${emotes[inherit.emote].name}' (${inherit.emote})!`}
            </pre> : null
        const emoteExistsWarning = layer.emote != null && layer.emote in emotes && emotes[layer.emote] !== layer ?
            <pre className="error">
                {`Attempting to create emote '${layer.name}' (${layer.emote}) but emote with same id '${emotes[layer.emote].name}' already exists!`}
            </pre> : null

        const emote = inherit.emote == null ? layer.emote : inherit.emote
        const emoteSlotDisabled = slot => {
            if ('emote' in inherit) return false

            if (isBundle) {
                return !asset.conflicts.emotes.includes(slot) || !(slot in emotes)
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
                        emoteExistsWarning != null
                }}
                defaultFolded={!isBundle && (asset != null || allEmotesDisabled)}
                state={[asset != null, allEmotesDisabled]}>
                {!isBundle && asset != null && inherit.emote == null &&
                    layer.emote != null &&
                    <pre className="info">
                        It's not recommended to make individual assets emotes
                    </pre>}
                {isBundle}
                {nestedEmoteWarning}
                {emoteExistsWarning}
                <Slots
                    title="Emote"
                    rows={3}
                    cols={4}
                    value={isBundle ? this.props.emote :
                        layer.emote == null ? inherit.emote : layer.emote}
                    onChange={isBundle ? this.selectEmote : this.changeEmote}
                    disabled={emoteSlotDisabled} />
            </Foldable>
        </div>
    }
}

export default connect()(EmoteSection)
