import { CustomPIXIComponent } from 'react-pixi-fiber'

const path = require('path')

const TYPE = 'Selector'

function getIcon (instance, image) {
    const icon = new window.PIXI.Sprite.fromImage(path.join('icons', image))
    icon.anchor.set(.5, .5)
    icon.interactive = true
    icon.on('mousedown', startDrag(instance))
        .on('touchstate', startDrag(instance))
        .on('mouseup', endDrag)
        .on('mouseupoutside', endDrag)
        .on('touchend', endDrag)
        .on('touchendoutside', endDrag)
    return icon
}

function startDrag(instance) {
    return e => {
        const target = e.currentTarget
        if (!target) return

        target.dragging = true
        const {x, y} = e.data.global
        target.startPosition = {x, y}
        target.startRotation = instance.rotation
        target.startScale = {x: instance.scale.x, y: instance.scale.y}
    }
}

function endDrag(e) {
    const target = e.currentTarget
    if (!target) return

    target.dragging = false
}

function onScale(instance, dispatch, corner) {
    return e => {
        const target = e.currentTarget
        if (!target || !target.dragging) return

        console.log(e, target.layer)
        const {x, y} = e.data.global
        // TODO deltaX/Y are not being calculated correctly
        let deltaX = x - target.startPosition.x
        let deltaY = y - target.startPosition.y
        console.log(deltaX, target.layer.width, target.layer.layer.scaleX)

        let offsetX = 0
        let offsetY = 0

        if (e.data.originalEvent.ctrlKey) {
            deltaX *= 2
            deltaY *= 2
        } else {
            // TODO offsets based on corner            
        }

        let scaleX = deltaX / target.layer.width
        let scaleY = deltaY / target.layer.height

        scaleX *= target.layer.layer.scaleX
        scaleY *= target.layer.layer.scaleY

        if (e.data.originalEvent.shiftKey) {
            scaleX = scaleY = Math.min(scaleX, scaleY)
        }

        console.log(scaleX, scaleY)

        dispatch({
            type: 'EDIT_LAYER_SCALE',
            layer: target.layer.layer.path,
            scale: [scaleX, scaleY]
        })
    }
}

function onRotate(instance, dispatch) {
    return e => {
        const target = e.currentTarget
        if (!target || !target.dragging) return

        // Credit to https://bl.ocks.org/shancarter/1034db3e675f2d3814e6006cf31dbfdc
        const {x, y} = e.data.global
        const {tx, ty} = instance.worldTransform
        const a2 = Math.atan2(target.startPosition.y - ty, target.startPosition.x - tx)
        const a1 = Math.atan2(y - ty, x - tx)

        let angle = a1 - a2
        angle = angle + target.startRotation - instance.rotation

        if (e.data.originalEvent.shiftKey) {
            angle += instance.rotation
            angle = Math.round(angle / (Math.PI / 8)) * (Math.PI / 8)
            angle -= instance.rotation
            target.last = angle + instance.rotation
        }

        dispatch({
            type: 'ROTATE_LAYER',
            path: instance.props.layer.path,
            rotation: angle
        })
    }
}

function flipHoriz(instance, dispatch) {
    return () => {
        dispatch({
            type: 'EDIT_LAYER_SCALE',
            layer: instance.props.layer.path,
            scale: [-instance.layer.layer.scaleX, instance.layer.layer.scaleY]
        })
    }
}

function flipVert(instance, dispatch) {
    return () => {
        dispatch({
            type: 'EDIT_LAYER_SCALE',
            layer: instance.props.layer.path,
            scale: [instance.layer.layer.scaleX, -instance.layer.layer.scaleY]
        })
    }
}

function drawGraphics(instance, props) {
    const {scale, layer} = props
    instance.props = props

    instance.clear()

    if (instance.layer) {
        const {width, height} = instance.layer
        const {x, y, rotation} = layer
        instance.lineStyle(scale * 2, 0x888888)
            .moveTo(-width / 2 - scale, -height / 2 - scale)
            .lineTo(-width / 2 - scale, height / 2 + scale)
            .lineTo(width / 2 + scale, height / 2 + scale)
            .lineTo(width / 2 + scale, -height / 2 - scale)
            .lineTo(-width / 2 - scale, -height / 2 - scale)
        instance.position.set(x, y)
        instance.rotation = rotation

        instance.scalers.forEach((scaler, i) => {
            scaler.clear()
            scaler.lineStyle(scale * 2, 0xFFFFFF)
            scaler.beginFill(0x888888)
                .drawCircle((i % 2 === 0 ? 1 : -1) * (width / 2 + scale),
                    (Math.floor(i / 2) === 0 ? 1 : -1) * (height / 2 + scale), 4 * scale)
        })

        instance.rotate.position.set(width / 2 + 22 * scale,
            -height / 2 + 17 * scale)
        instance.rotate.scale.set(scale / 10)
        instance.flipHoriz.position.set(width / 2 + 22 * scale,
            -height / 2 + 52 * scale)
        instance.flipHoriz.scale.set(scale / 2)
        instance.flipVert.position.set(width / 2 + 22 * scale,
            -height / 2 + 87 * scale)
        instance.flipVert.scale.set(scale / 2)
    }    
}

const behavior = {
    customDisplayObject: () => new window.PIXI.Graphics(),
    customApplyProps: (instance, oldProps, newProps) => {
        drawGraphics(instance, newProps)
    },
    customDidAttach: instance => {
        let root = instance
        while (root.parent && root.parent.parent)
            root = root.parent

        // root should be the viewport
        // instance.layer will be used for calculating bounds

        instance.rotate = getIcon(instance, 'rotate.png')
            .on('mousemove', onRotate(instance, instance.props.dispatch))
            .on('touchmove', onRotate(instance, instance.props.dispatch))
        instance.addChild(instance.rotate)
        instance.flipHoriz = getIcon(instance, 'flipHoriz.png')
            .on('click', flipHoriz(instance, instance.props.dispatch))
        instance.addChild(instance.flipHoriz)
        instance.flipVert = getIcon(instance, 'flipVert.png')
            .on('click', flipVert(instance, instance.props.dispatch))
        instance.addChild(instance.flipVert)

        instance.scalers = new Array(4).fill(0).map(() => {
            const g = new window.PIXI.Graphics()
            g.interactive = true
            g.on('mousedown', startDrag(instance))
                .on('touchstate', startDrag(instance))
                .on('mouseup', endDrag)
                .on('mouseupoutside', endDrag)
                .on('touchend', endDrag)
                .on('touchendoutside', endDrag)
                .on('mousemove', onScale(instance, instance.props.dispatch))
                .on('touchmove', onScale(instance, instance.props.dispatch))
            instance.addChild(g)
            g.layer = instance.parent
            return g
        })
        
        instance.layer = instance.parent
        instance.setParent(root)
        drawGraphics(instance, instance.props, instance.props)
    }
}

export default CustomPIXIComponent(behavior, TYPE)
