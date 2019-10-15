import React, { Component } from 'react'
import { connect } from 'react-redux'
import Angle from './fields/Angle'
import Vector2 from './fields/Vector2'
import Foldable from '../ui/Foldable'
import { changeLayer } from '../../redux/editor/layers'

class TransformSection extends Component {
    constructor(props) {
        super(props)

        this.changePosition = this.changePosition.bind(this)
        this.changeScale = this.changeScale.bind(this)
        this.changeLayer = this.changeLayer.bind(this)
    }

    changePosition(pos) {
        this.props.dispatch(changeLayer(this.props.target, { x: pos[0], y: pos[1] }))
    }

    changeScale(scale) {
        this.props.dispatch(changeLayer(this.props.target, { scaleX: scale[0], scaleY: scale[1] }))
    }

    changeLayer(key) {
        return value => { this.props.dispatch(changeLayer(this.props.target, { [key]: value })) }
    }

    render() {
        const {
            asset, layer
        } = this.props

        return <div className="action">
            <Foldable title="Transform" defaultFolded={asset == null} state={asset == null}>
                {asset == null && <div className="info">
                    Be cautious when transforming non-asset layers!
                </div>}
                <Vector2
                    title="Position"
                    value={[layer.x || 0, -layer.y || 0]}
                    onChange={this.changePosition} />
                <Vector2
                    title="Scale"
                    value={[layer.scaleX || 1, layer.scaleY || 1]}
                    onChange={this.changeScale}
                    float={true}
                    step={.01} />
                <Angle
                    title="Rotation"
                    value={layer.rotation}
                    onChange={this.changeLayer('rotation')} />
            </Foldable>
        </div>
    }
}

export default connect()(TransformSection)
