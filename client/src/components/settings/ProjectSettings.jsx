import React, {Component} from 'react'
import { connect } from 'react-redux'
import Scrollbar from 'react-custom-scroll'
import Header from './../inspector/Header'
import Foldable from './../ui/Foldable'
import Checkbox from '../inspector/fields/Checkbox'
import Color from '../inspector/fields/Color'
import Number from '../inspector/fields/Number'
import Text from '../inspector/fields/Text'
import Shortcuts from './Shortcuts'

class ProjectSettings extends Component {
    constructor(props) {
        super(props)

        this.handleChange = this.handleChange.bind(this)
        this.randomizeNickname = this.randomizeNickname.bind(this)
    }

    handleChange(name) {
        return value => this.props.dispatch({
            type: 'UPDATE_SETTING',
            name,
            value
        })
    }

    randomizeNickname() {
        this.props.dispatch({
            type: 'RANDOMIZE_NICKNAME'
        })
    }

    render() {
        return (
            <div className="panel">
                <div className="inspector">   
                    <Header targetName="Project Settings" />
                    <div className="inspector-content">
                        <Scrollbar allowOuterScroll={true} heightRelativeToParent="100%">
                            <div className="action">
                                <Foldable title="Popout">
                                    <Checkbox title="Always On Top" value={this.props.alwaysOnTop} onChange={this.handleChange('alwaysOnTop')} />
                                </Foldable>
                            </div>
                            <div className="action">
                                <Foldable title="Nickname">
                                    <Text title="Nickname" value={this.props.nickname} onChange={this.handleChange('nickname')} />
                                    <button onClick={this.randomizeNickname}>Randomize</button>
                                </Foldable>
                            </div>
                            <div className="action">
                                <Foldable title="Networking Settings">
                                    <Text title="Server IP" value={this.props.ip} onChange={this.handleChange('ip')} />
                                    <Number title="Server Port" value={this.props.port} onChange={this.handleChange('port')} />
                                    <button onClick={this.connect}>Connect</button>
                                </Foldable>
                            </div>
                            <div className="action">
                                <Foldable title="Global Shortcuts">
                                    <div className="info">
                                        These are shortcuts that will activate even when the window is not in focus, and override any function they already had (except for OS level shortcuts). For that reason, its recommended to use either macro keys or use 1+ modifier keys (ctrl, alt, etc.)
                                    </div>
                                    <Shortcuts />
                                </Foldable>
                            </div>
                        </Scrollbar>
                    </div>
                </div>
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        alwaysOnTop: state.project.settings.alwaysOnTop,
        nickname: state.project.settings.nickname,
        ip: state.project.settings.ip,
        port: state.project.settings.port
    }
}

export default connect(mapStateToProps)(ProjectSettings)
