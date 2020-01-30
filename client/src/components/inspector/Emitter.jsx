import React, {Component} from 'react'
import { connect } from 'react-redux'
import Scrollbar from 'react-custom-scroll'
import Header from './Header'
import ShapeSection from './ShapeSection'
import ColorSection from './ColorSection'
import SpeedSection from './SpeedSection'
import SizeSection from './SizeSection'
import RotationSection from './RotationSection'
import EmitterSection from './EmitterSection'
import AdvancedEmitterSection from './AdvancedEmitterSection'
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
        this.changeLifetime = this.changeLifetime.bind(this)
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

    changeLifetime(value) {
        this.props.dispatch(changeEmitter(this.props.target, { lifetime: { min: value[0], max: value[1] } }))
    }

    render() {
        const { name, emitter } = this.props.emitters[this.props.target[0]]
        const { x, y } = emitter.pos
        const {
            alpha, scale, color, speed, acceleration,
            maxSpeed, startRotation,
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
                            <Vector2
                                title="Particle Lifetime"
                                value={[lifetime.min, lifetime.max]}
                                xLabel="Min"
                                yLabel="Max"
                                onChange={this.changeLifetime}
                                float={true}
                                step={.1}
                                help="How long does each particle exist before being removed." />
                        </Foldable>
                    </div>
                    <ShapeSection target={this.props.target} spawnType={spawnType} />
                    <ColorSection target={this.props.target} alpha={alpha} color={color} />
                    <SpeedSection target={this.props.target} speed={speed} maxSpeed={maxSpeed} acceleration={acceleration} />
                    <SizeSection target={this.props.target} scale={scale} />
                    <RotationSection target={this.props.target} startRotation={startRotation} rotationSpeed={rotationSpeed} />
                    <EmitterSection target={this.props.target} frequency={frequency} emitterLifetime={emitterLifetime} maxParticles={maxParticles} />
                    <AdvancedEmitterSection target={this.props.target} blendMode={blendMode} addAtBack={addAtBack} />
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
