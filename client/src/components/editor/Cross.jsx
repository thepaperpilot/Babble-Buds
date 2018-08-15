import { CustomPIXIComponent } from 'react-pixi-fiber'

const TYPE = 'Cross'
const behavior = {
    customDisplayObject: () => new window.PIXI.Graphics(),
    customApplyProps: (instance, oldProps, newProps) => {
        const {x, y, scale, color, distance} = newProps

        instance.clear()
            .lineStyle(scale, color)
            .moveTo(x - distance, y)
            .lineTo(x + distance, y)
            .moveTo(x, y - distance)
            .lineTo(x, y + distance)
    }
}

export default CustomPIXIComponent(behavior, TYPE)
