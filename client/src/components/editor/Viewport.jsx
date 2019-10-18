import React, { Component } from 'react'
import { CustomPIXIComponent, withApp } from 'react-pixi-fiber'
import Viewport from 'pixi-viewport'

const TYPE = 'Viewport'
const behavior = {
    customDisplayObject: props => {
        const v = new Viewport({
            screenWidth: props.width,
            screenHeight: props.height
        })
            .drag()
            .wheel()
            .clampZoom({
                minWidth: 1,
                minHeight: 1,
                maxWidth: 800000,
                maxHeight: 800000
            })
        v.app = props.app

        v.off('pointerdown', v.down)
        //v.off('pointermove', v.move)
        //v.off('pointerup', v.up)
        //v.off('pointerupoutside', v.up)
        v.off('pointercancel', v.up)
        v.off('pointerout', v.up)
        v.on('rightdown', e => {
            e.data.originalEvent = Object.assign({}, e.data.originalEvent, {
                button: 0
            })
            v.down(e)
        })
        v.on('rightup', v.up)
        v.on('rightclick', () => v.plugins.drag.last = false)

        v.on('moved', () => v.app.renderer.render(v.app.stage))

        v.moveCenter(0, -props.height / 2)

        props.viewport.current = v

        return v
    },
    customApplyProps: (instance, oldProps, newProps) => {
        const { x, y } = instance.center
        instance.resize(newProps.width, newProps.height)
        if (newProps.children[2])
            // Maintain center
            instance.moveCenter(x, y)
        else
            // Set center to bottom middle
            instance.moveCenter(0, -newProps.height / 2 / instance.scale.x)
    },
    customDidAttach: instance => {
        instance.scale.set(1, 1)
    }
}

const ViewportComponent = withApp(CustomPIXIComponent(behavior, TYPE))

class ViewportWrapper extends Component {
    constructor(props) {
        super(props)

        this.viewport = {}
    }

    getViewport() {
        return this.viewport.current
    }

    render() {
        return <ViewportComponent {...this.props} viewport={this.viewport} />
    }
}

export default ViewportWrapper
