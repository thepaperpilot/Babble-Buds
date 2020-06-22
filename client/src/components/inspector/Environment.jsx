import React, {Component} from 'react'
import { connect } from 'react-redux'
import Scrollbar from 'react-custom-scroll'
import Header from './Header'
import Checkbox from './fields/Checkbox'
import Number from './fields/Number'
import Text from './fields/Text'
import Color from './fields/Color'
import Foldable from '../ui/Foldable'
import Dropdown from '../ui/InspectorDropdown'
import EnvironmentContextMenu from '../environments/EnvironmentContextMenu'
import { changeEnvironment } from '../../redux/project/environments/actions'

class Environment extends Component {
    constructor(props) {
        super(props)

        this.changeEnvironment = this.changeEnvironment.bind(this)
    }

    changeEnvironment(key) {
        return value => {
            this.props.dispatch(changeEnvironment(this.props.target, { [key]: value }))
        }
    }

    render() {
        const {
            name, puppetScale, numCharacters,
            color, themeApp, width, height
        } = this.props.environment

        const disabled = this.props.target === -1

        const LinkedEnvironmentContextMenu =
            EnvironmentContextMenu(this.props.contextmenu)

        return (
            <div className="inspector">
                <Header targetName={name} />
                <Dropdown menu={LinkedEnvironmentContextMenu}
                    id={`contextmenu-environment-${this.props.contextmenu}`}
                    collect={() => ({
                        environment: this.props.target,
                        disabled
                    })}/>
                <div className="inspector-content">
                    <Scrollbar allowOuterScroll={true} heightRelativeToParent="100%">
                        {disabled ? <div className="action">
                            <div className="info">
                                The default environment is used as a fallback and cannot be edited. To change the environment please create a new one or duplicate the default environment.
                            </div>
                        </div> : null}
                        <div className="action">
                            <Foldable title="General">
                                <Text
                                    title="Environment Name"
                                    value={name}
                                    onChange={this.changeEnvironment('name')}
                                    disabled={disabled} />
                            </Foldable>
                        </div>
                        <div className="action">
                            <Foldable title="Stage Settings">
                                <Number
                                    title="Puppet Scale"
                                    value={puppetScale}
                                    float={true}
                                    step={.1}
                                    onChange={this.changeEnvironment('puppetScale')}
                                    disabled={disabled} />
                                <Number
                                    title="Number of Slots"
                                    value={numCharacters}
                                    onChange={this.changeEnvironment('numCharacters')}
                                    disabled={disabled} />
                                <Color
                                    title="Background Color"
                                    value={color}
                                    onChange={this.changeEnvironment('color')}
                                    disabled={disabled} />
                                <Checkbox
                                    title="Tint Window"
                                    value={themeApp}
                                    onChange={this.changeEnvironment('themeApp')}
                                    disabled={disabled} />
                            </Foldable>
                        </div>
                        <div className="action">
                            <Foldable title="Scaling Settings">
                                <Number
                                    title="Width"
                                    value={width}
                                    onChange={this.changeEnvironment('width')}
                                    disabled={disabled} />
                                <Number
                                    title="Height"
                                    value={height}
                                    onChange={this.changeEnvironment('height')}
                                    disabled={disabled} />
                            </Foldable>
                        </div>
                    </Scrollbar>
                </div>
            </div>
        )
    }
}

function mapStateToProps(state, props) {
    const environment = props.target === -1 ?
        state.defaults.environment :
        state.project.environments[props.target]

    return {
        environment
    }
}

export default connect(mapStateToProps)(Environment)
