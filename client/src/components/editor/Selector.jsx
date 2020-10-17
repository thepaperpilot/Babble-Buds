import React, { Component } from 'react'
import { CustomPIXIComponent, withApp } from 'react-pixi-fiber'
import ScaleContext from './ScaleContext'
import { changeLayer } from '../../redux/editor/layers'
import { getTheme } from '../project/Themer'

import rotateIcon from './icons/rotate.png'
import flipHorizIcon from './icons/flipHoriz.png'
import flipVertIcon from './icons/flipVert.png'

const {Sprite, Graphics, Container, Circle} = window.PIXI
const icons = {
    'rotate.png': rotateIcon,
    'flipHoriz.png': flipHorizIcon,
    'flipVert.png': flipVertIcon
}

const directions = [
    'se',
    'sw',
    'ne',
    'nw'
]

const TYPE = 'Selector'

function getIcon (instance, image) {
    const icon = Sprite.from(icons[image])
    icon.anchor.set(.5, .5)
    icon.interactive = true
    icon.cursor = `pointer`
    icon.on('mousedown', startDrag(instance))
        .on('touchstate', startDrag(instance))
    return icon
}

function getEmitterSize({ lifetime, speed, maxSpeed, acceleration, scale }, container) {
    const isAccelerating = acceleration.x || acceleration.y
    const avgSpeed = isAccelerating ?
        maxSpeed || speed.start + Math.sqrt(acceleration.x * acceleration.x + acceleration.y * acceleration.y) / 2 :
        (speed.start + speed.end) / 2
    const texture = container.children[0].emitter.particleImages[0]
    const textureSize = Math.max(scale.start, scale.end) * Math.max(texture.width, texture.height)
    return 2 * lifetime.max * avgSpeed + textureSize
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

        let root = instance
        while (root.parent && root.parent.parent)
            root = root.parent
        root.cursor = target.cursor
    }
}

function endRotateDrag(instance) {
    return e => {
        const {angle, dragging, startRotation} = e.currentTarget
        if (dragging) {
            window.store.dispatch(changeLayer(instance.props.layer.path, {
                rotation: (startRotation || 0) + angle
            }))
            e.currentTarget.dragging = false
            e.stopPropagation()

            let root = instance
            while (root.parent && root.parent.parent)
                root = root.parent
            root.cursor = null
        }
    }
}

function endScaleDrag(instance) {
    return e => {
        const {layer, scaleX, scaleY, posX, posY, dragging} = e.currentTarget
        if (dragging) {
            window.store.dispatch(changeLayer(layer.layer.path, {
                scaleX,
                scaleY,
                x: posX,
                y: posY
            }))
            e.currentTarget.dragging = false
            e.stopPropagation()

            let root = instance
            while (root.parent && root.parent.parent)
                root = root.parent
            root.cursor = null
        }
    }
}

function endMoveDrag(instance, e) {
    const {startPosition, dx, dy} = e.currentTarget
    if (instance.props.disabled) return

    if (startPosition && (dx || dy)) {
        const pos = {
            x: startPosition.x + (dx || 0),
            y: startPosition.y + (dy || 0)
        }
        if (instance.props.isEmitter) {
            instance.layer.position.x = 0
            instance.layer.position.y = 0
        }
        window.store.dispatch(changeLayer(instance.props.layer.path, instance.props.isEmitter ? { pos } : pos))
        e.currentTarget.dx = 0
        e.currentTarget.dy = 0

        let root = instance
        while (root.parent && root.parent.parent)
            root = root.parent
        root.cursor = null
    }
}

function onMove(instance) {
    return e => {
        const target = e.currentTarget
        if (!target) return
        if (!e.data.buttons) return
        if (instance.props.disabled) return

        const {x, y} = e.data.global
        let dx = x - target.startMouse.x
        let dy = y - target.startMouse.y

        // Transform data based on the container's transform matrix
        const mat = instance.layer.transform.worldTransform.clone()
        mat.translate(-mat.tx, -mat.ty)
        const point = mat.applyInverse({ x: dx, y: dy })

        if (e.data.originalEvent.ctrlKey) {
            if (Math.abs(dx) > Math.abs(dy)) {
                dy = 0
            } else
                dx = 0
        }

        // Store data for setting it on dragEnd
        target.dx = point.x
        target.dy = point.y

        // Update the layer and selector now
        if (instance.props.isEmitter) {
            instance.layer.position.x = point.x
            instance.layer.position.y = point.y
        } else {
            instance.layer.position.x = target.startPosition.x + point.x
            instance.layer.position.y = target.startPosition.y + point.y
        }

        instance.selector.position.x = target.startPosition.x + dx * instance.props.scale
        instance.selector.position.y = target.startPosition.y + dy * instance.props.scale
        
        instance.props.app.renderer.render(instance.props.app.stage)
    }
}

function onScale(instance, corner) {
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

        // Store data for setting it on dragEnd
        target.scaleX = scaleX
        target.scaleY = scaleY
        target.posX = target.startPosition.x + offsetX
        target.posY = target.startPosition.y + offsetY

        // Update the layer and selector now
        instance.layer.children[0].scale.x = scaleX
        instance.layer.children[0].scale.y = scaleY
        instance.layer.position.x = target.posX
        instance.layer.position.y = target.posY

        drawGraphics(instance)
        instance.selector.position.set(target.posX, target.posY)
        instance.props.app.renderer.render(instance.props.app.stage)
    }
}

function onRotate(instance) {
    return e => {
        const target = e.currentTarget
        if (!target || !target.dragging) return

        // Credit to https://bl.ocks.org/shancarter/1034db3e675f2d3814e6006cf31dbfdc
        const {x, y} = e.data.global
        const {tx, ty} = instance.selector.worldTransform
        const a2 = Math.atan2(target.startMouse.y - ty, target.startMouse.x - tx)
        const a1 = Math.atan2(y - ty, x - tx)

        let angle = a1 - a2 + target.startRotation

        if (e.data.originalEvent.shiftKey) {
            angle += instance.selector.rotation
            angle = Math.round(angle / (Math.PI / 8)) * (Math.PI / 8)
            angle -= instance.selector.rotation
        }

        // Store data for setting it on dragEnd
        target.angle = angle - target.startRotation

        // Update the layer and selector now
        instance.layer.rotation = angle
        instance.selector.rotation = angle

        instance.props.app.renderer.render(instance.props.app.stage)
    }
}

function flipHoriz(instance) {
    return e => {
        window.store.dispatch(changeLayer(instance.props.layer.path, {
            scaleX: -(instance.layer.layer.scaleX || 1),
            scaleY: instance.layer.layer.scaleY || 1
        }))
        e.stopPropagation()
    }
}

function flipVert(instance) {
    return e => {
        window.store.dispatch(changeLayer(instance.props.layer.path, {
            scaleX: instance.layer.layer.scaleX || 1,
            scaleY: -(instance.layer.layer.scaleY || 1)
        }))
        e.stopPropagation()
    }
}

function drawGraphics(instance) {
    const {scale, layer, disabled, isEmitter, app, emitters} = instance.props
    const selectorColor = `0x${getTheme(window.store.getState().environment.color)['far-background']}`

    if (instance.selector) {
        instance.selector.clear()
        
        instance.selector.alpha = disabled ? .5 : 1

        // Set rotations of all parents to 0 to calculate bounds correctly
        let rotation = 0
        let rotationPointer = instance.layer
        let rotationHistory = []
        while (rotationPointer.parent && rotationPointer.parent.parent) {
            const { a, d } = rotationPointer.transform.worldTransform
            rotation += rotationPointer.rotation * Math.sign(a) * Math.sign(d)
            rotationHistory.push(rotationPointer.rotation)
            rotationPointer.rotation = 0
            rotationPointer = rotationPointer.parent
        }

        // Set position to 0 to calculate bounds correctly
        let x = instance.layer.x
        let y = instance.layer.y
        instance.layer.x = 0
        instance.layer.y = 0

        if (instance.layer) {
            // Calculate instance bounds
            // and use them to get bottom-left and upper-right points in viewport (root) space
            let p1, p2
            if (isEmitter) {
                //bounds = getEmitterBounds(layer.emitter, instance.parent.children[0])
            } else if (emitters) {
                let minX, minY, maxX, maxY
                emitters.forEach(({ emitter }, i) => {
                    const pos = emitter.pos
                    //const size = getEmitterBounds(emitter, instance.parent.children[i]) / 2
                    //minX = Math.min(minX || 0, pos.x - size)
                    //maxX = Math.max(maxX || 0, pos.x + size)
                    //minY = Math.min(minY || 0, -pos.y - size)
                    //maxY = Math.max(maxY || 0, -pos.y + size)
                })
                //width = Math.max(maxX, -minX) * 2 * (layer.scaleX || 1)
                //height = Math.max(maxY, -minY) * 2 * (layer.scaleY || 1)
            } else {
                const bounds = instance.layer.getLocalBounds()
                p1 = { x: bounds.left, y: bounds.bottom }
                p2 = { x: bounds.right, y: bounds.top }
            }

            // Calculate root container for comparison with the instance container or its parent
            let root = instance
            while (root.parent && root.parent.parent)
                root = root.parent
            // If the selector has been removed, selector === root and mess things up
            if (root === instance)
                return

            // Transform the two bounding points so they're in the viewport's local space
            // When parent containers are rotated, the bounding box can appear shorter/taller than it should be
            // I believe its something to do with scaleX not applying when converting coordinates toGlobal, for some reason
            // Fortunately the ratio of width to height should stay the same (with scaleX applied),
            //  so it can be used to figure out the intended height of the box
            let p1Global = instance.layer.toGlobal(p1)
            let p2Global = instance.layer.toGlobal(p2)
            const middleY = (p1Global.y + p2Global.y) / 2
            const actualRatio = (p2.y - p1.y) / (p2.x - p1.x)
            const height = (p2Global.x - p1Global.x) * actualRatio / 2
            p1Global.y = middleY + height
            p2Global.y = middleY - height
            p1 = root.toLocal(p1Global)
            p2 = root.toLocal(p2Global)

            const offset = root.toLocal(instance.layer.toGlobal({ x: 0, y: 0 }))

            // Put positions and rotations back where they were
            instance.layer.x = x
            instance.layer.y = y

            rotationPointer = instance.layer
            while (rotationPointer.parent && rotationPointer.parent.parent) {
                rotationPointer.rotation = rotationHistory.shift()
                rotationPointer = rotationPointer.parent
            }

            // Set selector position and rotation
            root.toLocal(instance.layer.toGlobal({ x: 0, y: 0 }), null, instance.selector.position)
            instance.selector.rotation = rotation

            // Store instance bounds for tracking scaling
            instance.selector.normalSize = { x: p2.x - p1.x, y: p2.y - p1.y }

            // Draw selector box
            instance.selector.lineStyle(scale * 4, selectorColor)
                .moveTo(p1.x - scale - offset.x, p1.y - scale - offset.y)
                .lineTo(p1.x - scale - offset.x, p2.y + scale - offset.y)
                .lineTo(p2.x + scale - offset.x, p2.y + scale - offset.y)
                .lineTo(p2.x + scale - offset.x, p1.y - scale - offset.y)
                .lineTo(p1.x - scale - offset.x, p1.y - scale - offset.y)

            // Draw rotation pivot point
            instance.selector.drawCircle(0, 0, scale)

            // Draw "scalers", draggable caps at each of the 4 vertices of the selector box
            instance.scalers.forEach((scaler, i) => {
                if (disabled || isEmitter) {
                    instance.selector.removeChild(scaler)
                } else {
                    instance.selector.addChild(scaler)

                    const x = (i % 2 === 0 ? p2.x + scale : p1.x - scale) - offset.x
                    const y = (Math.floor(i / 2) === 0 ? p2.y + scale : p1.y - scale) - offset.y
                    scaler.clear()
                    scaler.hitArea = new Circle(x, y, scale * 8)
                    scaler.lineStyle(scale * 2, selectorColor)
                    scaler.beginFill(selectorColor)
                        .drawCircle(x, y, 6 * scale)
                }
            })

            // Update position and scale of rotate and flipping buttons
            if (disabled || isEmitter) {
                instance.selector.removeChild(instance.rotate)
                instance.selector.removeChild(instance.flipHoriz)
                instance.selector.removeChild(instance.flipVert)
            } else {
                instance.selector.addChild(instance.rotate)
                instance.selector.addChild(instance.flipHoriz)
                instance.selector.addChild(instance.flipVert)
                const xPos = Math.max(p1.x, p2.x) + 23 * scale - offset.x
                const yPos = Math.min(p1.y, p2.y) - offset.y
                instance.rotate.position.set(xPos, yPos + 17 * scale)
                instance.rotate.scale.set(scale / 10)
                instance.flipHoriz.position.set(xPos, yPos + 52 * scale)
                instance.flipHoriz.scale.set(scale / 2)
                instance.flipVert.position.set(xPos, yPos + 87 * scale)
                instance.flipVert.scale.set(scale / 2)
            }
        }
    }
    app.renderer.render(app.stage)
}

export const behavior = {
    customDisplayObject: () => new Container(),
    customApplyProps: (instance, oldProps, newProps) => {
        instance.props = newProps
        // wait a frame before redrawing so the selected layer gets its props applied
        //setTimeout(() => drawGraphics(instance), 1)
    },
    customDidAttach: instance => {
        instance.unsubscribe = window.store.subscribe(() =>
            behavior.customApplyProps(instance, instance.props, instance.props)
        )
        instance.props.registerOnUpdateListeners(instance.onUpdateListener = () => drawGraphics(instance))
        instance.props.selector.current = instance
        behavior.setupSelector(instance)
    },
    customWillDetach: instance => {
        // This function gets called by Layer because for some reason
        // react-pixi-fiber just... doesn't
        if (instance.selector)
            instance.selector.parent.removeChild(instance.selector)
        instance.unsubscribe()
        instance.props.unregisterOnUpdateListeners(instance.onUpdateListener)

        let root = instance
        while (root.parent && root.parent.parent)
            root = root.parent

        root.off('mousemove', instance.selector.mousemove)
        root.off('mouseup', instance.mouseup)
        root.off('mouseupoutside', instance.mouseup)
        root.off('mousedown', instance.mousedown)
    },
    setupSelector: instance => {
        if (instance.parent && instance.parent.parent) {
            let root = instance
            while (root.parent && root.parent.parent)
                root = root.parent

            // root should be the viewport
            // instance.layer will be used for calculating bounds
            instance.layer = instance.parent

            instance.selector = new Graphics()
            instance.selector.setParent(root)

            const endRot = endRotateDrag(instance)
            instance.rotate = getIcon(instance, 'rotate.png')
                .on('mousemove', onRotate(instance))
                .on('touchmove', onRotate(instance))
                .on('mouseup', endRot)
                .on('mouseupoutside', endRot)
                .on('touchend', endRot)
                .on('touchendoutside', endRot)
            instance.selector.addChild(instance.rotate)
            instance.flipHoriz = getIcon(instance, 'flipHoriz.png')
                .on('click', flipHoriz(instance))
            instance.selector.addChild(instance.flipHoriz)
            instance.flipVert = getIcon(instance, 'flipVert.png')
                .on('click', flipVert(instance))
            instance.selector.addChild(instance.flipVert)

            instance.scalers = new Array(4).fill(0).map((e, i) => {
                const g = new Graphics()
                g.interactive = true
                g.cursor = `${directions[i]}-resize`
                const endScale = endScaleDrag(instance)
                g.on('mousedown', startDrag(instance))
                    .on('touchstate', startDrag(instance))
                    .on('mouseup', endScale)
                    .on('mouseupoutside', endScale)
                    .on('touchend', endScale)
                    .on('touchendoutside', endScale)
                    .on('mousemove', onScale(instance, i))
                    .on('touchmove', onScale(instance, i))
                instance.selector.addChild(g)
                g.layer = instance.parent
                return g
            })

            drawGraphics(instance)

            // Setup input listeners for panning
            instance.selector.mousemove = onMove(instance)
            root.on('mousedown', instance.mousedown = e => {
                const {x, y} = e.data.global
                const layer = instance.layer
                const target = e.currentTarget
                if (instance.props.disabled) return
                target.startMouse = {x, y}
                target.startPosition = instance.props.isEmitter ?
                    layer.layer.emitter.pos : {x: layer.layer.x || 0, y: layer.layer.y || 0}
                root.on('mousemove', instance.selector.mousemove)
            })
            root.on('mouseup', instance.mouseup = e => {
                root.off('mousemove', instance.selector.mousemove)
                endMoveDrag(instance, e)
            })
            root.on('mouseupoutside', instance.mouseup)
            // The icons need some time to show up for some reason /shrug
            setTimeout(() => instance.props.app.renderer.render(instance.props.app.stage), 1)
        } else {
            requestAnimationFrame(() => behavior.setupSelector(instance))
        }
    }
}

const Selector = withApp(CustomPIXIComponent(behavior, TYPE))

class SelectorWrapper extends Component {

    static contextType = ScaleContext

    constructor(props) {
        super(props)

        this.selector = {}
    }

    render() {
        return <Selector {...this.props} selector={this.selector} scale={this.context} />
    }
}

export default SelectorWrapper
