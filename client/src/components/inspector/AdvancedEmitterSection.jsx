import React, { Component } from 'react'
import { connect } from 'react-redux'
import Select from './fields/Select'
import Checkbox from './fields/Checkbox'
import Foldable from '../ui/Foldable'
import { changeEmitter } from '../../redux/editor/layers'

class AdvancedEmitterSection extends Component {
    constructor(props) {
        super(props)

        this.changeEmitter = this.changeEmitter.bind(this)
    }

    changeEmitter(key) {
        return value => this.props.dispatch(changeEmitter(this.props.target, { [key]: value }))
    }

    render() {
        const {
            blendMode, addAtBack
        } = this.props

        return <div className="action">
            <Foldable title="Advanced Properties">
                <Select
                    title="Blend Mode"
                    value={blendMode}
                    onChange={this.changeEmitter('blendMode')}
                    options={[
                        { value: 'normal', label: 'Normal' },
                        { value: 'add', label: 'Add' },
                        { value: 'multiply', label: 'Multiply' },
                        { value: 'screen', label: 'Screen' }
                    ]} />
                <Checkbox
                    title="Add At Back"
                    value={addAtBack}
                    onChange={this.changeEmitter('addAtBack')} />
            </Foldable>
        </div>
    }
}

export default connect()(AdvancedEmitterSection)
