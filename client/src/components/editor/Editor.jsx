import React, {Component} from 'react'
import { connect } from 'react-redux'
import { Stage } from 'react-pixi-fiber'
import { DropTarget } from 'react-dnd'
import Viewport from './Viewport'
import Layer from './Layer'
import Cross from './Cross'
import { getTheme } from '../project/Themer'
import { save } from '../../redux/editor/editor'
import { addLayer } from '../../redux/editor/layers'
import { selectLayer } from '../../redux/editor/selected'
import './editor.css'

const DISTANCE = 10000
const TYPE_MAP = {
    environment: p => p.settings.environments,
    puppet: p => p.characters,
    asset: p => p.assets
}

class Editor extends Component {
    constructor(props) {
        super(props)

        this.stage = React.createRef()
        this.viewport = React.createRef()
        this.selectedRef = React.createRef()

        this.state = {
            scale: 1,
            grid: props.grid,
            play: 0,
            highlight: props.highlight,
            bounds: {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0
            },
            dragPos: null
        }

        this.updateViewportBounds = this.updateViewportBounds.bind(this)
        this.onScroll = this.onScroll.bind(this)
        this.onMouseDown = this.onMouseDown.bind(this)
        this.changeZoom = this.changeZoom.bind(this)
        this.toggleHighlight = this.toggleHighlight.bind(this)
        this.savePuppet = this.savePuppet.bind(this)
        this.playAnimation = this.playAnimation.bind(this)
        this.resetPos = this.resetPos.bind(this)
        this.renderViewport = this.renderViewport.bind(this)
    }

    componentDidMount() {
        const v = this.viewport.current.getViewport()
        v.on('moved', this.updateViewportBounds)
        v.on('zoomed', this.updateViewportBounds)
    }

    componentDidUpdate(prevProps) {
        if (this.props.bounds !== prevProps.bounds || this.props.rect !== prevProps.rect)
            this.updateViewportBounds()
        else
            this.renderViewport()
    }

    updateViewportBounds() {
        const {top, right, bottom, left} = this.viewport.current.getViewport()
        this.setState({
            bounds: {top, right, bottom, left}
        }, this.renderViewport)
    }

    onScroll(e) {
        // For some reason the wheel plugin doesn't seem to get these events by default
        // Additionally, it expects clientX and clientY to be relative
        // to the canvas, which is not true
        const rect = e.target.getBoundingClientRect()
        e.clientX -= rect.left
        e.clientY -= rect.top
        this.viewport.current.getViewport().plugins.wheel.wheel(e)

        this.setState({
            scale: 1 / this.viewport.current.getViewport().scale.x
        })
        this.updateViewportBounds()
    }

    onMouseDown(e) {
        e.preventDefault()
    }

    changeZoom(e) {
        this.props.onZoomChange(parseInt(e.target.value, 10))
        this.setState({
            grid: parseInt(e.target.value, 10)
        })
    }

    toggleHighlight() {
        this.props.onHighlightChange(!this.state.highlight)
        this.setState({
            highlight: !this.state.highlight
        })
    }

    savePuppet() {
        this.props.dispatch(save())
    }

    playAnimation() {
        this.setState({
            play: this.state.play + 1
        })
    }

    resetPos() {
        const {rect, changed} = this.props
        this.viewport.current.getViewport().moveCenter(0, -(rect.height - 21 - (changed ? 6 : 0)) / 2)
        this.updateViewportBounds()
    }

    hover(dragPos) {
        const v = this.viewport.current.getViewport()
        const { top, left, transform} = v
        const rect = this.stage.current._canvas.getBoundingClientRect()
        const scale = transform.scale.x
        
        this.setState({
            dragPos: {
                x: left + (dragPos.x - rect.x) / scale,
                y: top + (dragPos.y - rect.y) / scale
            }
        })
    }

    renderViewport() {
        const v = this.viewport.current.getViewport()
        v.app.renderer.render(v.app.stage)
    }

    render() {
        // TODO (re-)load assets since babble.js isn't here to do it for us
        const {rect, layers, selected, changed, isOver, canDrop, item, color} = this.props
        const {scale, grid, bounds, dragPos} = this.state

        let {highlight, 'far-background': background, raised} = getTheme(color)
        highlight = `0x${highlight.slice(1)}`
        background = `0x${background.slice(1)}`
        raised = `0x${raised.slice(1)}`

        const gridLines = []
        if (grid !== -1) {
            const gridSize = Math.pow(10, 4 - grid)
            const startX = Math.ceil(bounds.left / gridSize) * gridSize
            const startY = Math.ceil(bounds.top / gridSize) * gridSize

            if ((bounds.right - bounds.left) / gridSize <= 100)
                for (let i = startX; i < bounds.right; i += gridSize) {
                    gridLines.push(<Cross key={`h${i}`}
                        x={i}
                        y={bounds.top}
                        scale={scale}
                        color={raised}
                        distance={bounds.bottom - bounds.top} />)
                }

            if ((bounds.bottom - bounds.top) / gridSize <= 100)
                for (let i = startY; i < bounds.bottom; i += gridSize) {
                    gridLines.push(<Cross key={`v${i}`}
                        x={bounds.left}
                        y={i}
                        scale={scale}
                        color={raised}
                        distance={bounds.right - bounds.left} />)
                }
        }

        return this.props.connectDropTarget(
            <div className={`panel editor${changed ? ' changed' : ''}`}
                style={{
                    // Set background color based on the current drop status
                    backgroundColor: !isOver && canDrop ? 'rgba(0, 255, 0, .05)' : ''
                }}>
                <div className="bar flex-row">
                    <button onClick={this.savePuppet}>Apply</button>
                    <div className="toggle" style={{ backgroundColor: this.state.highlight ? 'var(--highlight)' : 'var(--background)'}} onClick={this.toggleHighlight}>
                        Highlight Current Layer
                    </div>
                    <button onClick={this.playAnimation} title="Play all animations">▶</button>
                    <div className="flex-item">Zoom: {Math.round(1 / scale * 100)}%</div>
                    <div className="flex-item" onClick={this.resetPos}>Pos: {Math.round((bounds.right + bounds.left) / 2)},
                        {-Math.round((bounds.bottom + bounds.top) / 2)}</div>
                    <input
                        type="range"
                        min="-1"
                        max="4"
                        value={this.state.grid}
                        onChange={this.changeZoom} />
                    <div className="flex-grow"></div>
                </div>
                <Stage width={rect.width - (changed ? 6 : 0)} height={rect.height - 21 - (changed ? 6 : 0)} options={{
                    transparent: true,
                    antialias: true,
                    autoStart: false
                }} onWheel={this.onScroll} onMouseDown={this.onMouseDown}
                ref={this.stage} >
                    <Viewport width={rect.width - (changed ? 6 : 0)} height={rect.height - 21 - (changed ? 6 : 0)} ref={this.viewport}>
                        {gridLines}
                        <Cross x={0} y={0} scale={scale * 2} color={highlight} distance={DISTANCE * scale} />
                        {!!layers && <Layer play={this.state.play} layer={layers} bundles={[]}
                            x={0} y={0} selectorColor={background} selectedRef={this.selectedRef} scale={scale}
                            highlight={this.state.highlight ? selected : null} />}
                        {isOver && dragPos &&
                            <Layer layer={{
                                id: item.id,
                                rotation: 0,
                                scaleX: 1,
                                scaleY: 1,
                                x: 0,
                                y: 0,
                                path: []
                            }} bundles={[]} x={dragPos.x} y={dragPos.y}
                            scale={scale} highlight={[]} />}
                    </Viewport>
                </Stage>
            </div>
        )
    }
}

function mapStateToProps(state) {
    const {layers, type, id, selected} = state.editor.present

    return {
        canDrop: !!layers,
        changed: id && type && (TYPE_MAP[type](state.project)[id] == null ||
            JSON.stringify(layers) !==
            JSON.stringify(TYPE_MAP[type](state.project)[id].layers)),
        selected: selected.layer,
        layers,
        type,
        id,
        color: state.environment.color
    }
}

const assetTarget = {
    drop: (item, monitor, component) => {
        const {x, y} = component.state.dragPos
        const {id, asset} = monitor.getItem()

        let l = item.selected || []
        let curr = item.character;
        (l || []).forEach((index, i) => {
            if (curr.children[index] != null)
                curr = curr.children[index]
            else l = l.slice(0, i)
        })
        const path = curr.id ? l.slice(0, -1) : l

        item.dispatch(addLayer(path, {
            id,
            leaf: true,
            name: asset.name,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            x, y
        }))
        
        item.dispatch(selectLayer([...path, curr.children ? curr.children.length : l.slice(-1)[0] + 1]))
    },
    canDrop: (item) => {
        return item.canDrop
    },
    hover: (item, monitor, component) => {
        if (item.canDrop)
            component.hover(monitor.getClientOffset())
    }
}

function collect(connect, monitor) {
    return {
        connectDropTarget: connect.dropTarget(),
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
        item: monitor.getItem()
    }
}

export default connect(mapStateToProps)(DropTarget('asset', assetTarget, collect)(Editor))
