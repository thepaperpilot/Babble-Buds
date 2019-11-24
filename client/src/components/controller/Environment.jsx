import React, {Component} from 'react'
import { connect } from 'react-redux'
import { DropTarget } from 'react-dnd'
import classNames from 'classnames'
import { ContextMenuTrigger } from 'react-contextmenu'
import { setEnvironment } from '../../redux/environment'
import { setSlot } from '../../redux/project/settings/environmentHotbar'

class Environment extends Component {
    constructor(props) {
        super(props)

        this.changeEnvironment = this.changeEnvironment.bind(this)
    }

    changeEnvironment() {
        this.props.dispatch(setEnvironment(this.props.self, this.props.env, this.props.environment))
    }

    render() {
        const { env, environment, thumbnail, selected, isOver, canDrop, index } = this.props
        const className = {
            'char': true,
            'selector': true,
            isOver,
            canDrop,
            selected
        }
        if (!environment) {
            return this.props.connectDropTarget(<div className="react-contextmenu-wrapper">
                <div className={classNames(className)}>
                    <div className="hotkey"></div>
                    <div className="desc"></div>
                </div>
            </div>)
        }
        return <ContextMenuTrigger
            id={`contextmenu-environment-${this.props.contextmenu}`}
            holdToDisplay={-1}
            collect={() => ({
                index,
                env,
                environment
            })}>
            {this.props.connectDropTarget(<div
                data-index={index}
                className={classNames(className)}
                onClick={this.changeEnvironment}>
                <div className="hotkey">Shift+{index + 1}</div>
                <div className="desc">{environment.name}</div>
                <img alt={environment.name} src={thumbnail} draggable={false} />
            </div>)}
        </ContextMenuTrigger>
    }
}

function mapStateToProps(state, props) {
    const env = state.project.settings.environmentHotbar[props.index]
    let environment = state.project.environments[env]
    if (env === -1)
        environment = state.defaults.environment
    return {
        env,
        environment,
        thumbnail: state.project.characterThumbnails[env],
        selected: state.environment.setter === state.self && state.environment.environmentId === env,
        self: state.self
    }
}

const environmentTarget = {
    drop(props, monitor) {
        props.dispatch(setSlot(props.index, monitor.getItem().environment))
    }
}

function collect(connect, monitor) {
    return {
        connectDropTarget: connect.dropTarget(),
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop()
    }
}

export default connect(mapStateToProps)(DropTarget('environment', environmentTarget, collect)(Environment))
