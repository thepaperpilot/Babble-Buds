import React, {Component} from 'react'
import { connect } from 'react-redux'
import Scrollbar from 'react-custom-scroll'
import {Puppet} from 'babble.js'
import Header from './Header'
import ColorSection from './ColorSection'
import SpeedSection from './SpeedSection'
import SizeSection from './SizeSection'
import Text from './fields/Text'
import Vector2 from './fields/Vector2'
import Dropdown from '../ui/InspectorDropdown'
import Foldable from '../ui/Foldable'
import LayerContextMenu from '../layers/LayerContextMenu'
import { changeEmitter, changeEmitterName } from '../../redux/editor/layers'

class Emitter extends Component {
    constructor(props) {
        super(props)

        this.changeName = this.changeName.bind(this)
        this.changeEmitter = this.changeEmitter.bind(this)
        this.changePosition = this.changePosition.bind(this)
    }

    changeName(name) {
        this.props.dispatch(changeEmitterName(this.props.target, name))
    }

    changeEmitter(key) {
        return value => {
            this.props.dispatch(changeEmitter(this.props.target, { [key]: value }))
        }
    }

    changePosition(pos) {
        this.props.dispatch(changeEmitter(this.props.target, { pos: { x: pos[0], y: -pos[1] } }))
    }

    render() {
        const { name, emitter } = this.props.emitters[this.props.target[0]]
        const { x, y } = emitter.pos
        const {
            alpha, scale, color, speed, acceleration,
            maxSpeed, startRotation, noRotation,
            rotationSpeed, lifetime, blendMode,
            frequency, emitterLifetime, maxParticles,
            addAtBack, spawnType, spawnCircle
        } = emitter

        const LinkedLayerContextMenu = LayerContextMenu(this.props.contextmenu)

        return <div className="inspector">
            <Header targetName={name} />
            <Dropdown menu={LinkedLayerContextMenu}
                id={`contextmenu-layer-${this.props.contextmenu}`}
                collect={() => ({
                    path: this.props.target,
                    emitter
                })} />
            <div className="inspector-content">
                <Scrollbar allowOuterScroll={true} heightRelativeToParent="100%">
                    <div className="action">
                        <Foldable title="General">
                            <Text
                                title="Layer Name"
                                value={name}
                                onChange={this.changeName} />
                            <Vector2
                                title="Position"
                                value={[x || 0, -y || 0]}
                                onChange={this.changePosition} />
                        </Foldable>
                    </div>
                    <ColorSection target={this.props.target} alpha={alpha} color={color} />
                    <SpeedSection target={this.props.target} speed={speed} maxSpeed={maxSpeed} acceleration={acceleration} />
                    <SizeSection target={this.props.target} scale={scale} />
                </Scrollbar>
            </div>
        </div>
    }
}

function mapStateToProps(state) {
    return {
        assets: state.project.assets,
        emitters: state.editor.present.layers
    }
}

export default connect(mapStateToProps)(Emitter)
