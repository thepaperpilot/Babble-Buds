import { CustomPIXIComponent } from 'react-pixi-fiber'
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

        return v
    },
    customApplyProps: (instance, oldProps, newProps) => {
        instance.resize(newProps.width, newProps.height)
        instance.moveCenter(0, -newProps.height / 2)
    },
    customDidAttach: instance => {
        instance.scale.set(1, 1)
    }
}

export default CustomPIXIComponent(behavior, TYPE)
