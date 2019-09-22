import React, {Component} from 'react'
import { connect } from 'react-redux'
import { Sprite, Container } from 'react-pixi-fiber'
import Selector, { behavior } from './Selector'
import { comparePaths } from './../layers/Layer'

const path = require('path')
const TextureCache = window.PIXI.utils.TextureCache

class RawLayer extends Component {
    constructor(props) {
        super(props)

        this.selector = React.createRef()
    }

    componentWillUnmount() {
        // This is necessary because removing a layer with a selector on it
        // won't call the customWillDetach function on the Selector for some reason
        if (this.selector.current)
            behavior.customWillDetach(this.selector.current)
    }

    render() {
        const {
            layer,
            bundles,
            assets,
            assetsPath,
            emote,
            selected,
            scale,
            highlight,
            ...props
        } = this.props

        const isHighlighted = comparePaths(highlight, layer.path)
        const isSelected = selected && comparePaths(selected, layer.path)

        let element
        if (layer.id) {
            switch (assets[layer.id].type) {
            case 'bundle': 
                if (bundles.includes(layer.id))
                    return null
                return <Container
                    alpha={layer.emote != null && (emote == null || layer.emote !== emote) ? 0 : 1}
                    layer={layer}
                    x={layer.x || 0}
                    y={layer.y || 0}
                    rotation={layer.rotation || 0}
                    {...props} >
                    <Container scale={[layer.scaleX || 1, layer.scaleY || 1]}>
                        {assets[layer.id].layers.children.map((l, i) =>
                            <Layer bundles={[...bundles, layer.id]} key={i} layer={l} scale={scale} highlight={isHighlighted ? l.path : highlight} />)}
                    </Container>
                    {isSelected && bundles.length === 0 && 
                        <Selector ref={this.selector} scale={scale} layer={layer} dispatch={this.props.dispatch} />}
                </Container>
            default: element = <Sprite
                anchor={[.5,.5]}
                alpha={isHighlighted ? 1 : .5}
                scale={[layer.scaleX || 1, layer.scaleY || 1]}
                texture={TextureCache[path.join(assetsPath, assets[layer.id].location)]} />
            }
        } else
            element = <Container scale={[layer.scaleX || 1, layer.scaleY || 1]}>
                {(layer.children || []).map((l, i) =>
                    <Layer key={i} layer={l} bundles={bundles} scale={scale} highlight={isHighlighted ? l.path : highlight} />)}
            </Container>

        return  <Container
            alpha={layer.emote != null && (emote == null || layer.emote !== emote) ? 0 : 1}
            layer={layer}
            x={layer.x || 0}
            y={layer.y || 0}
            rotation={layer.rotation || 0}
            {...props} >
            {element}
            {isSelected &&
                <Selector ref={this.selector} scale={scale} layer={layer} dispatch={this.props.dispatch} />}
        </Container>
    }
}

function mapStateToProps(state) {
    return {
        emote: state.editor.present.emote,
        selected: state.editor.present.layer,
        assets: state.project.assets,
        assetsPath: state.project.assetsPath
    }
}

const Layer = connect(mapStateToProps)(RawLayer)
export default Layer
