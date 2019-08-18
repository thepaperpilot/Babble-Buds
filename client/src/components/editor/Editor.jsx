import React, {Component} from 'react'
import { connect } from 'react-redux'
import { Stage } from 'react-pixi-fiber'
import Viewport from './Viewport'
import Layer from './Layer'
import Cross from './Cross'
import './editor.css'

const DISTANCE = 10000

class Editor extends Component {
    constructor(props) {
        super(props)

        this.viewport = React.createRef()
        this.selectedRef = React.createRef()

        this.state = {
            scale: 1,
            grid: props.grid,
            highlight: props.highlight,
            bounds: {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0
            }
        }

        this.updateViewportBounds = this.updateViewportBounds.bind(this)
        this.onScroll = this.onScroll.bind(this)
        this.onMouseDown = this.onMouseDown.bind(this)
        this.changeZoom = this.changeZoom.bind(this)
        this.toggleHighlight = this.toggleHighlight.bind(this)
        this.savePuppet = this.savePuppet.bind(this)
        this.resetPos = this.resetPos.bind(this)

        window.PIXI.SCALE_MODES.DEFAULT = window.PIXI.SCALE_MODES.NEAREST
    }

    componentDidMount() {
        this.viewport.current.on('moved', this.updateViewportBounds)
        this.viewport.current.on('zoomed', this.updateViewportBounds)
    }

    componentDidUpdate(prevProps) {
        if (this.props.bounds !== prevProps.bounds || this.props.rect !== prevProps.rect)
            this.updateViewportBounds()
    }

    updateViewportBounds() {
        const {top, right, bottom, left} = this.viewport.current
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
        this.viewport.current.plugins.wheel.wheel(e)

        this.setState({
            scale: 1 / this.viewport.current.scale.x
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
        this.props.dispatch({ type: 'SAVE_EDITOR' })
    }

    resetPos() {
        const {rect, changed} = this.props
        this.viewport.current.moveCenter(0, -(rect.height - 21 - (changed ? 6 : 0)) / 2)
        this.updateViewportBounds()
    }

    render() {
        // TODO (re-)load assets since babble.js isn't here to do it for us
        const {rect, character, selected, changed} = this.props
        const {scale, grid, bounds} = this.state

        const gridLines = []
        if (grid !== -1) {
            const gridSize = Math.pow(10, 4 - grid)
            const startX = Math.ceil(bounds.left / gridSize) * gridSize
            const startY = Math.ceil(bounds.top / gridSize) * gridSize

            for (let i = startX; i < bounds.right; i += gridSize) {
                gridLines.push(<Cross key={`h${i}`}
                    x={i}
                    y={bounds.top}
                    scale={scale}
                    color={0x222222}
                    distance={bounds.bottom - bounds.top} />)
            }

            for (let i = startY; i < bounds.bottom; i += gridSize) {
                gridLines.push(<Cross key={`v${i}`}
                    x={bounds.left}
                    y={i}
                    scale={scale}
                    color={0x222222}
                    distance={bounds.right - bounds.left} />)
            }
        }

        return (
            <div className={`panel editor${changed ? ' changed' : ''}`}>
                <div className="bar flex-row">
                    <button onClick={this.savePuppet}>Apply</button>
                    <div className="toggle" style={{ backgroundColor: this.state.highlight ? '#333c4a' : '#242a33'}} onClick={this.toggleHighlight}>
                        Highlight Current Layer
                    </div>
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
                    antialias: true
                }} onWheel={this.onScroll} onMouseDown={this.onMouseDown}>
                    <Viewport width={rect.width - (changed ? 6 : 0)} height={rect.height - 21 - (changed ? 6 : 0)} ref={this.viewport}>
                        {gridLines}
                        <Cross x={0} y={0} scale={scale} color={0x888888} distance={DISTANCE * scale} />
                        <Layer layer={character} x={0} y={0} selectedRef={this.selectedRef} scale={scale} highlight={this.state.highlight ? selected : character.path} />
                    </Viewport>
                </Stage>
            </div>
        )
    }
}

function mapStateToProps(state) {
    const {character, type, id, layer} = state.editor.present
    const layers = character ? character.layers : []

    console.log(state.project)

    return {
        character: layers,
        changed: id && type &&
            JSON.stringify(character) !== JSON.stringify(state.project[type === 'assets' ? type : 'characters'][id]),
        selected: layer
    }
}

export default connect(mapStateToProps)(Editor)
