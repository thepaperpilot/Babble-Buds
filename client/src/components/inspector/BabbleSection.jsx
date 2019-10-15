import React, {Component} from 'react'
import { connect } from 'react-redux'
import Checkbox from './fields/Checkbox'
import Foldable from '../ui/Foldable'
import { changeLayer } from '../../redux/editor/layers'

class BabbleSection extends Component {
    constructor(props) {
        super(props)

        this.changeLayer = this.changeLayer.bind(this)
        this.changeEmoteLayer = this.changeEmoteLayer.bind(this)
    }

    changeLayer(key) {
        return value => {
            this.props.dispatch(changeLayer(this.props.target, { [key]: value }))
        }
    }

    changeEmoteLayer(emote) {
        return value => {
            this.props.dispatch(changeLayer(this.props.target, {
                emoteLayer: value ? emote : 'base'
            }))
        }
    }

    render() {
        const {
            inherit, layer, asset, finder, emoteLayer
        } = this.props

        const nestedHeadWarning = 'head' in inherit && layer.head != null ?
            <pre className="error">
                Attempting to make this layer a head layer but it is already inside one.
            </pre> : null
        const nestedEmoteLayerWarning = 'emoteLayer' in inherit && layer.emoteLayer != null ?
            <pre className="error">
                {`Attempting to make this layer a${layer.emoteLayer === 'mouth' ? ' mouth' : 'n eyes'} layer but it is already inside a${inherit.emoteLayer === 'mouth' ? ' mouth' : 'n eyes'} layer.`}
            </pre> : null
        const bundleHeadConflictWarning = asset && asset.type === 'bundle' &&
            asset.conflicts.head && ('head' in inherit || layer.head != null) ?
            <pre className="error">
                {`This asset bundle has a mouth and/or eyes layer inside it but it is already inside a${inherit.emoteLayer === 'mouth' ? ' mouth' : 'n eyes'} layer.`}
            </pre> : null
        const bundleEmoteLayerConflictWarning = asset && asset.type === 'bundle' &&
            asset.conflicts.emoteLayer && ('emoteLayer' in inherit || layer.emoteLayer != null) ?
            <pre className="error">
                This asset bundle has a head layer inside it but it is already inside one.
            </pre> : null

        const emoteLayerDisabled = ('emoteLayer' in inherit || finder('emoteLayer')) && layer.emoteLayer == null

        return <div className="action">
            <Foldable title="Babble" classNames={{
                    warning: nestedHeadWarning != null ||
                        nestedEmoteLayerWarning != null ||
                        bundleHeadConflictWarning != null ||
                        bundleEmoteLayerConflictWarning != null
                }}>
                {nestedHeadWarning}
                {nestedEmoteLayerWarning}
                {bundleHeadConflictWarning}
                {bundleEmoteLayerConflictWarning}
                <Checkbox
                    title="Head"
                    value={layer.head || inherit.head}
                    onChange={this.changeLayer('head')}
                    disabled={('head' in inherit || finder('head')) && !layer.head}
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
    }
}

export default connect()(BabbleSection)
