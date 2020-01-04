import React, {Component} from 'react'
import { Sprite, Container, withApp } from 'react-pixi-fiber'
import Selector, { behavior } from './Selector'
import { comparePaths } from '../layers/Layer'
import babble from 'babble.js'
import silhoutte from './icons/person.png'

const path = require('path')
const TextureCache = window.PIXI.utils.TextureCache
const Texture = window.PIXI.Texture
Texture.from(silhoutte)

class RawLayer extends Component {
    constructor(props) {
        super(props)

        this.selector = React.createRef()
        this.container = React.createRef()
    }

    componentWillUnmount() {
        // This is necessary because removing a layer with a selector on it
        // won't call the customWillDetach function on the Selector for some reason
        if (this.selector.current)
            behavior.customWillDetach(this.selector.current.selector.current)
    }

    componentDidUpdate(prevProps) {
        const wasInvisible = prevProps.layer.emote != null && (prevProps.emote == null || prevProps.layer.emote !== prevProps.emote)
        const isInvisible = this.props.layer.emote != null && (this.props.emote == null || this.props.layer.emote !== this.props.emote)

        if (this.props.layer.animation !== 'None' && ((!isInvisible && wasInvisible) ||
            prevProps.layer.animation !== this.props.layer.animation ||
            prevProps.layer.easing !== this.props.layer.easing ||
            prevProps.layer.duration !== this.props.layer.duration ||
            prevProps.layer.delay !== this.props.layer.delay ||
            prevProps.play !== this.props.play)) {
            babble.Puppet.createTween(this.props.layer, this.container.current).on('update', () => {
                this.props.app.renderer.render(this.props.app.stage)
            })
        }
    }

    render() {
        const {
            layer,
            bundles,
            assets,
            assetsPath,
            selected,
            scale,
            highlight,
            play,
            selectorColor,
            environment,
            dispatch,
            ...props
        } = this.props

        const isHighlighted = highlight == null || comparePaths(highlight, layer.path)
        const isSelected = selected.layer && bundles.length == 0 &&
            comparePaths(selected.layer, layer.path)

        const layerProps = {
            play,
            scale,
            selected,
            selectorColor,
            assets,
            assetsPath,
            environment,
            dispatch
        }

        let element
        if (layer.id && layer.id in assets) {
            switch (assets[layer.id].type) {
            case 'bundle': 
                if (bundles.includes(layer.id))
                    return null
                return <Container
                    ref={this.container}
                    alpha={layer.emote != null &&
                        (selected.emote == null || layer.emote !== selected.emote) ? 0 : 1}
                    layer={layer}
                    x={layer.x || 0}
                    y={layer.y || 0}
                    rotation={layer.rotation || 0}
                    {...props} >
                    <Container scale={[layer.scaleX || 1, layer.scaleY || 1]}>
                        {assets[layer.id].layers.children.map((l, i) =>
                            <Layer bundles={[...bundles, layer.id]}
                                key={i} layer={l} {...layerProps}
                                highlight={isHighlighted ? l.path : highlight} />)}
                    </Container>
                    {isSelected && bundles.length === 0 && 
                        <Selector ref={this.selector} scale={scale} layer={layer}
                            dispatch={dispatch} selectorColor={selectorColor} />}
                </Container>
            case 'particles':                
                element = null
                break
            default: element = <Sprite
                anchor={[.5,.5]}
                alpha={isHighlighted ? 1 : .5}
                scale={[layer.scaleX || 1, layer.scaleY || 1]}
                texture={TextureCache[path.join(assetsPath, assets[layer.id].location)]} />
            }
        } else if (layer.id === 'CHARACTER_PLACEHOLDER') {
            const numCharacters = Math.max(1, environment.numCharacters)
            const size = Math.min(environment.width / numCharacters, environment.height)
            return <Container ref={this.container} x={0} y={-environment.height / 2}>
                <Container x={0} y={0}>
                    {new Array(numCharacters).fill(0).map((e, i) =>
                        <Sprite key={i}
                            alpha={.5}
                            texture={Texture.from(silhoutte)}
                            width={size}
                            height={size}
                            x={-environment.width / 2 + (i + .5) * environment.width / numCharacters - size / 2}
                            y={environment.height / 2 - size} />)}
                    <Sprite width={environment.width / 2} height={environment.height} y={-environment.height / 2} />
                </Container>
                <Selector scale={scale} layer={{ x: 0, y: -environment.height / 2, rotation: 0 }}
                    dispatch={dispatch} disabled={true} selectorColor={selectorColor} />
            </Container>
        } else
            element = <Container scale={[layer.scaleX || 1, layer.scaleY || 1]}>
                {(layer.children || []).map((l, i) =>
                    <Layer key={i} layer={l} bundles={bundles} {...layerProps}
                        highlight={isHighlighted ? l.path : highlight} />)}
            </Container>

        return  <Container
            ref={this.container}
            alpha={layer.emote != null &&
                (selected.emote == null || layer.emote !== selected.emote) ? 0 : 1}
            layer={layer}
            x={layer.x || 0}
            y={layer.y || 0}
            rotation={layer.rotation || 0}
            {...props} >
            {element}
            {isSelected &&
                <Selector ref={this.selector} scale={scale} layer={layer}
                    dispatch={dispatch} selectorColor={selectorColor}/>}
        </Container>
    }
}

const Layer = withApp(RawLayer)
export default Layer
