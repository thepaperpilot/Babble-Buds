import React, {Component} from 'react'
import { connect } from 'react-redux'
import {Puppet} from 'babble.js'
import Slots from './fields/Slots'
import Foldable from './../ui/Foldable'

class EmoteSection extends Component {
    constructor(props) {
        super(props)

        this.changeEmote = this.changeEmote.bind(this)
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
            finder('emote')

        const allEmotesDisabled = [...Array(12).keys()].map(emoteSlotDisabled).every(b => b)

        return <div className="action">
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
    }
}

export default connect()(EmoteSection)
