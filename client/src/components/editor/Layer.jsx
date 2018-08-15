import React, {Component} from 'react'
import { connect } from 'react-redux'
import { Sprite, Container } from 'react-pixi-fiber'
import Selector from './Selector'

const path = require('path')
const TextureCache = window.PIXI.utils.TextureCache

class RawLayer extends Component {
    render() {
        const {layer, assets, assetsPath, emote, selected, scale, ...props} = this.props

        return  <Container
            alpha={layer.emote != null && (emote == null || layer.emote !== emote) ? 0 : 1}
            layer={layer}
            x={layer.x}
            y={layer.y}
            rotation={layer.rotation}
            {...props} >
            {layer.id ?
                <Sprite
                    anchor={[.5,.5]}
                    scale={[layer.scaleX, layer.scaleY]}
                    texture={TextureCache[path.join(assetsPath, assets[layer.id].location)]} /> :
                (layer.children || []).map((layer, i) =>
                    <Layer key={i} layer={layer} scale={scale} />)}
            {layer.id && JSON.stringify(selected) === JSON.stringify(layer.path) &&
                <Selector scale={scale} layer={layer} dispatch={this.props.dispatch} />}
        </Container>
        
    }
}

function mapStateToProps(state) {
    return {
        emote: state.editor.emote,
        selected: state.editor.layer,
        assets: state.project.assets,
        assetsPath: state.project.assetsPath
    }
}

const Layer = connect(mapStateToProps)(RawLayer)
export default Layer
