import React, {Component} from 'react'
import { connect } from 'react-redux'
import { createStageClass } from 'react-pixi-fiber'
import { DropTarget } from 'react-dnd'
import classNames from 'classnames'
import Viewport from './Viewport'
import Layer from './Layer'
import Grid from './Grid'
import ScaleContext from './ScaleContext'
import { save } from '../../redux/editor/editor'
import { addLayer } from '../../redux/editor/layers'
import { selectLayer } from '../../redux/editor/selected'
import './editor.css'

const PARTICLE_FRAME_DURATION = 25
const TYPE_MAP = {
    environment: (p, id) => p.environments[id] && p.environments[id].layers,
    puppet: (p, id) => p.characters[id] && p.characters[id].layers,
    asset: (p, id) => p.assets[id] && p.assets[id].layers,
    particles: (p, id) => p.assets[id] && p.assets[id].emitters
}

const Stage = createStageClass()

class Editor extends Component {
    constructor(props) {
        super(props)

        this.stage = React.createRef()
        this.viewport = React.createRef()
        this.selectedRef = React.createRef()
        this.intervalId = null
        this.onUpdateListeners = []

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
        if (this.viewport.current) {
            const v = this.viewport.current.getViewport()
            v.on('moved', this.updateViewportBounds)
            v.on('zoomed', this.updateViewportBounds)
        }
        this.onUpdateListeners.forEach(cb => cb())
    }

    componentDidUpdate(prevProps) {
        if (this.props.bounds !== prevProps.bounds || this.props.rect !== prevProps.rect)
            this.updateViewportBounds()
        else if (!this.intervalId)
            this.renderViewport()
        this.onUpdateListeners.forEach(cb => cb())
    }

    updateViewportBounds() {
        const {top, right, bottom, left} = this.viewport.current.getViewport()
        this.setState({
            bounds: {top, right, bottom, left}
        })
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
        if (this.viewport.current) {
            const {rect, changed} = this.props
            this.viewport.current.getViewport().moveCenter(0, -(rect.height - 21 - (changed ? 6 : 0)) / 2)
            this.updateViewportBounds()
        }
    }

    hover(dragPos) {
        if (this.viewport.current) {
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
    }

    renderViewport() {
        if (this.viewport.current) {
            const v = this.viewport.current.getViewport()
            v.app.renderer.render(v.app.stage)
        }
    }

    render() {
        // TODO (re-)load assets since babble.js isn't here to do it for us
        let layers = this.props.layers
        const {rect, selected, changed, isOver, canDrop, item, color} = this.props
        const {assets, assetsPath, environment} = this.props
        const {scale, grid, bounds, dragPos} = this.state

        const layerProps = {
            selected,
            assets,
            assetsPath,
            environment,
            registerOnUpdateListeners: listener => this.onUpdateListeners.push(listener),
            unregisterOnUpdateListeners: listener => this.onUpdateListeners.splice(this.onUpdateListeners.indexOf(listener), 1)
        }

        // Find the currently selected layer so that if its a particle effect we can render every frame
        if (selected.layer) {
            // Handle it being a particle effect asset separately
            if (Array.isArray(layers)) {
                if (!this.intervalId)
                    this.intervalId = setInterval(this.renderViewport, PARTICLE_FRAME_DURATION)
            } else {
                let currentLayer = layers
                for (let i = 0; i < selected.layer.length; i++)
                    currentLayer = layers.children[selected.layer[i]]
                if (currentLayer && currentLayer.id && currentLayer.id in assets && assets[currentLayer.id].type === 'particles') {
                    if (!this.intervalId) {
                        this.intervalId = setInterval(this.renderViewport, PARTICLE_FRAME_DURATION)
                    }
                } else if (this.intervalId) {
                    clearInterval(this.intervalId)
                    this.intervalId = null
                }
            }            
        } else if (this.intervalId) {
            clearInterval(this.intervalId)
            this.intervalId = null
        }

        if (Array.isArray(layers)) {
            layers = { children: layers.map((l, i) => ({...l, path: [i] }))}
        }

        return this.props.connectDropTarget(
            <div className={classNames({
                panel: true,
                editor: true,
                changed,
                canDrop: canDrop && !isOver
            })}>
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
                <div className="changed-warning" style={{ height: rect.height - 25 }}></div>
                <Stage options={{
                    width: rect.width,
                    height: rect.height,
                    transparent: true,
                    antialias: true,
                    autoStart: false
                }} onWheel={this.onScroll} onMouseDown={this.onMouseDown}
                ref={this.stage} >
                    <ScaleContext.Provider value={scale}>
                        <Viewport width={rect.width} height={rect.height} ref={this.viewport}>
                            <Grid grid={grid} scale={scale} bounds={bounds} color={color} />
                            {!!layers && <Layer play={this.state.play} layer={layers} bundles={[]}
                                x={0} y={0} selectedRef={this.selectedRef} {...layerProps}
                                highlight={this.state.highlight ? selected.layer : null} />}
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
                                {...layerProps} highlight={[]} />}
                        </Viewport>
                    </ScaleContext.Provider>
                </Stage>
            </div>
        )
    }
}

function mapStateToProps(state) {
    const {layers, type, id, selected} = state.editor.present

    return {
        canDrop: !!layers && type !== 'particles',
        changed: id && type && (TYPE_MAP[type](state.project, id) == null ||
            JSON.stringify(layers) !==
            JSON.stringify(TYPE_MAP[type](state.project, id))),
        selected,
        layers,
        assets: state.project.assets,
        assetsPath: state.project.assetsPath,
        environment: state.project.environments[id],
        type,
        id,
        color: state.environment.color
    }
}

const assetTarget = {
    drop: (item, monitor, component) => {
        const {x, y} = component.state.dragPos
        const {id, asset} = monitor.getItem()

        let l = item.selected.layer || []
        let curr = item.layers;
        l.forEach((index, i) => {
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
