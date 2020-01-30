import React, { Component } from 'react'
import { connect } from 'react-redux'
import Select from './fields/Select'
import Foldable from '../ui/Foldable'
import { changeEmitter } from '../../redux/editor/layers'

class ShapeSection extends Component {
    constructor(props) {
        super(props)

        this.changeEmitter = this.changeEmitter.bind(this)
    }

    changeEmitter(key) {
        return value => this.props.dispatch(changeEmitter(this.props.target, { [key]: value }))
    }

    render() {
        const {
            spawnType
        } = this.props

        return <div className="action">
            <Foldable title="Emitter Shape">
                <Select
                    title="Spawn Shape"
                    value={spawnType}
                    onChange={this.changeEmitter('spawnType')}
                    options={[
                        { value: 'point', label: 'Point' },
                        { value: 'rectangle', label: 'Rectangle' },
                        { value: 'circle', label: 'Circle' },
                        { value: 'ring', label: 'Ring' },
                        { value: 'burst', label: 'Burst' }
                    ]} />
            </Foldable>
        </div>
    }
}

export default connect()(ShapeSection)
