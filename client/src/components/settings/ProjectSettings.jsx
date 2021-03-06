import React, { Component } from 'react'
import { connect } from 'react-redux'
import Scrollbar from 'react-custom-scroll'
import Shortcuts from './Shortcuts'
import Header from '../inspector/Header'
import Foldable from '../ui/Foldable'
import Checkbox from '../inspector/fields/Checkbox'
import Text from '../inspector/fields/Text'
import { setAlwaysOnTop } from '../../redux/project/settings/settings'
import { setNickname, randomizeNickname } from
    '../../redux/project/settings/nickname'

class ProjectSettings extends Component {
    constructor(props) {
        super(props)

        this.changeAlwaysOnTop = this.changeAlwaysOnTop.bind(this)
        this.changeNickname = this.changeNickname.bind(this)
        this.randomizeNickname = this.randomizeNickname.bind(this)
    }

    changeAlwaysOnTop(alwaysOnTop) {
        this.props.dispatch(setAlwaysOnTop(alwaysOnTop))
    }

    changeNickname(name) {
        this.props.dispatch(setNickname(name))
    }

    randomizeNickname() {
        this.props.dispatch(randomizeNickname())
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
                                    <Checkbox title="Always On Top" value={this.props.alwaysOnTop} onChange={this.changeAlwaysOnTop} />
                                </Foldable>
                            </div>
                            <div className="action">
                                <Foldable title="Nickname">
                                    <Text title="Nickname" value={this.props.nickname} onChange={this.changeNickname} />
                                    <button onClick={this.randomizeNickname}>Randomize</button>
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
        nickname: state.project.settings.nickname
    }
}

export default connect(mapStateToProps)(ProjectSettings)
