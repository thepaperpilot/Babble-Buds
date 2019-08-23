import { CustomPIXIComponent } from 'react-pixi-fiber'

const path = require('path')
const {Sprite, Graphics, Container} = window.PIXI

const TYPE = 'Selector'

function getIcon (instance, image) {
    const icon = new Sprite.fromImage(path.join('icons', image))
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
        e.stopPropagation()

        target.dragging = true
        const {x, y} = e.data.global
        const layer = instance.layer
        target.startMouse = {x, y}
        target.startRotation = instance.selector.rotation
        target.startPosition = {x: layer.layer.x || 0, y: layer.layer.y || 0}
        target.startScale = {x: layer.layer.scaleX || 1, y: layer.layer.scaleY || 1}
        target.startSize = instance.selector.normalSize
    }
}

function endDrag(e) {
    const target = e.currentTarget
    if (!target) return

    target.dragging = false
}

function onMove(instance) {
    return e => {
        const target = e.currentTarget
        if (!target) return
        if (!e.data.buttons) return

        const {x, y} = e.data.global
        let dx = x - target.startMouse.x
        let dy = y - target.startMouse.y
        // Adjust for current editor zoom
        dx *= instance.props.scale
        dy *= instance.props.scale

        if (e.data.originalEvent.ctrlKey) {
            if (Math.abs(dx) > Math.abs(dy)) {
                dy = 0
            } else
                dx = 0
        }

        instance.props.dispatch({
            type: 'EDIT_LAYER_POSITION',
            layer: instance.props.layer.path,
            pos: [target.startPosition.x + dx, -target.startPosition.y - dy]
        })
    }
}

function onScale(instance, dispatch, corner) {
    return e => {
        const target = e.currentTarget
        if (!target || !target.dragging) return

        const {x, y} = e.data.global
        // Set deltaX/Y to how much we're changing the image, in pixels
        let dx = x - target.startMouse.x
        let dy = y - target.startMouse.y
        // Adjust for current editor zoom
        dx *= instance.props.scale
        dy *= instance.props.scale
        // Create new variables that account for rotation as well
        const rot = -target.layer.layer.rotation || 0
        let deltaX = dx * Math.cos(rot) - dy * Math.sin(rot)
        let deltaY = dy * Math.cos(rot) + dx * Math.sin(rot)

        let offsetX = 0
        let offsetY = 0

        if (e.data.originalEvent.ctrlKey) {
            // Don't move center, requiring us to double how much it shrinks
            deltaX *= 2
            deltaY *= 2
        } else {
            // Move center based on how much we moved it
            offsetX = dx / 2
            offsetY = dy / 2
        }

        // Change signs based on corner
        if (corner % 2 === 1)
            deltaX *= -1
        if (Math.floor(corner / 2) === 1)
            deltaY *= -1

        // Calculate modifier to go from previous scale to new scale
        const modX = (target.startSize.x + deltaX) / target.startSize.x
        const modY = (target.startSize.y + deltaY) / target.startSize.y
        // Calculate new scale
        let scaleX = target.startScale.x * modX
        let scaleY = target.startScale.y * modY

        // If we held shift, make sure the scales are the same
        if (e.data.originalEvent.shiftKey) {
            // TODO Figure out how to calculate accurate offsets
            // when holding shift
            //scaleX = scaleY = Math.min(scaleX, scaleY)
        }

        dispatch({
            type: 'EDIT_LAYER_SCALE',
            layer: target.layer.layer.path,
            scale: [scaleX, scaleY],
            pos: [
                target.startPosition.x + offsetX,
                target.startPosition.y + offsetY
            ]
        })
    }
}

function onRotate(instance, dispatch) {
    return e => {
        const target = e.currentTarget
        if (!target || !target.dragging) return

        // Credit to https://bl.ocks.org/shancarter/1034db3e675f2d3814e6006cf31dbfdc
        const {x, y} = e.data.global
        const {tx, ty} = instance.selector.worldTransform
        const a2 = Math.atan2(target.startMouse.y - ty, target.startMouse.x - tx)
        const a1 = Math.atan2(y - ty, x - tx)

        let angle = a1 - a2
        angle = angle + target.startRotation - instance.selector.rotation

        if (e.data.originalEvent.shiftKey) {
            angle += instance.selector.rotation
            angle = Math.round(angle / (Math.PI / 8)) * (Math.PI / 8)
            angle -= instance.selector.rotation
            target.last = angle + instance.selector.rotation
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
            scale: [-(instance.layer.layer.scaleX || 1), instance.layer.layer.scaleY || 1]
        })
    }
}

function flipVert(instance, dispatch) {
    return () => {
        dispatch({
            type: 'EDIT_LAYER_SCALE',
            layer: instance.props.layer.path,
            scale: [instance.layer.layer.scaleX || 1, -(instance.layer.layer.scaleY || 1)]
        })
    }
}

function drawGraphics(instance, props) {
    const {scale, layer} = props
    instance.props = props

    if (instance.selector) {
        instance.selector.clear()

        if (instance.layer) {
            let {x, y, rotation} = layer
            let width, height

            x = x || 0
            y = y || 0
            rotation = rotation || 0

            const bounds = instance.layer.getLocalBounds()
            width = 2 * Math.max(Math.abs(bounds.left), Math.abs(bounds.right))
            height = 2 * Math.max(Math.abs(bounds.top), Math.abs(bounds.bottom))
            instance.selector.normalSize = {x: width, y: height}

            instance.selector.lineStyle(scale * 2, 0x888888)
                .moveTo(-width / 2 - scale, -height / 2 - scale)
                .lineTo(-width / 2 - scale, height / 2 + scale)
                .lineTo(width / 2 + scale, height / 2 + scale)
                .lineTo(width / 2 + scale, -height / 2 - scale)
                .lineTo(-width / 2 - scale, -height / 2 - scale)

            instance.selector.position.set(x, y)
            instance.selector.rotation = rotation

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
}

export const behavior = {
    customDisplayObject: () => new Container(),
    customApplyProps: (instance, oldProps, newProps) => {
        drawGraphics(instance, newProps)
    },
    customDidAttach: instance => {
        behavior.setupSelector(instance)
    },
    customWillDetach: instance => {
        // This function gets called by Layer because for some reason
        // react-pixi-fiber just... doesn't 
        instance.selector.parent.removeChild(instance.selector)

        let root = instance
        while (root.parent && root.parent.parent)
            root = root.parent

        root.off('mousemove', instance.selector.mousemove)
        root.off('mouseup', instance.mouseup)
        root.off('mousedown', instance.mousedown)
    },
    setupSelector: instance => {
        if (instance.parent.parent) {
            let root = instance
            while (root.parent && root.parent.parent)
                root = root.parent

            // root should be the viewport
            // instance.layer will be used for calculating bounds
            instance.layer = instance.parent
            //instance.setParent(root)

            instance.selector = new Graphics()
            instance.selector.setParent(instance.parent.parent)

            instance.rotate = getIcon(instance, 'rotate.png')
                .on('mousemove', onRotate(instance, instance.props.dispatch))
                .on('touchmove', onRotate(instance, instance.props.dispatch))
            instance.selector.addChild(instance.rotate)
            instance.flipHoriz = getIcon(instance, 'flipHoriz.png')
                .on('click', flipHoriz(instance, instance.props.dispatch))
            instance.selector.addChild(instance.flipHoriz)
            instance.flipVert = getIcon(instance, 'flipVert.png')
                .on('click', flipVert(instance, instance.props.dispatch))
            instance.selector.addChild(instance.flipVert)

            instance.scalers = new Array(4).fill(0).map((e, i) => {
                const g = new Graphics()
                g.interactive = true
                g.on('mousedown', startDrag(instance))
                    .on('touchstate', startDrag(instance))
                    .on('mouseup', endDrag)
                    .on('mouseupoutside', endDrag)
                    .on('touchend', endDrag)
                    .on('touchendoutside', endDrag)
                    .on('mousemove', onScale(instance, instance.props.dispatch, i))
                    .on('touchmove', onScale(instance, instance.props.dispatch, i))
                instance.selector.addChild(g)
                g.layer = instance.parent
                return g
            })

            drawGraphics(instance, instance.props, instance.props)

            // Setup input listeners for panning
            instance.selector.mousemove = onMove(instance)
            root.on('mousedown', instance.mousedown = e => {
                const {x, y} = e.data.global
                const layer = instance.layer
                const target = e.currentTarget
                target.startMouse = {x, y}
                target.startPosition = {x: layer.layer.x || 0, y: layer.layer.y || 0}
                root.on('mousemove', instance.selector.mousemove)
            })
            root.on('mouseup', instance.mouseup = () => {
                root.off('mousemove', instance.selector.mousemove)
            })
        } else {
            requestAnimationFrame(() => behavior.setupSelector(instance))
        }
    }
}

export default CustomPIXIComponent(behavior, TYPE)
