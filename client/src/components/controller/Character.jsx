import React, {Component} from 'react'
import { connect } from 'react-redux'
import { DropTarget } from 'react-dnd'
import classNames from 'classnames'
import { ContextMenuTrigger } from 'react-contextmenu'
import { changePuppet } from '../../redux/controller'
import { setSlot } from '../../redux/project/settings/hotbar'

class Character extends Component {
    constructor(props) {
        super(props)

        this.changePuppet = this.changePuppet.bind(this)
    }

    changePuppet() {
        this.props.dispatch(changePuppet(this.props.index))
    }

    render() {
        const { puppet, character, thumbnail, selected, isOver, canDrop, index } = this.props
        const className = {
            'char': true,
            'selector': true,
            isOver,
            canDrop,
            selected
        }
        if (!character) {
            return this.props.connectDropTarget(<div className="react-contextmenu-wrapper">
                <div className={classNames(className)}>
                    <div className="hotkey"></div>
                    <div className="desc"></div>
                </div>
            </div>)
        }
        return <ContextMenuTrigger
            id={`contextmenu-character-${this.props.contextmenu}`}
            holdToDisplay={-1}
            collect={() => ({
                index,
                puppet,
                character
            })}>
            {this.props.connectDropTarget(<div
                data-index={index}
                className={classNames(className)}
                onClick={this.changePuppet}>
                <div className="hotkey">{index + 1}</div>
                <div className="desc">{character.name}</div>
                <img alt={character.name} src={thumbnail}/>
            </div>)}
        </ContextMenuTrigger>
    }
}

function mapStateToProps(state, props) {
    const puppet = state.project.settings.hotbar[props.index]
    return {
        puppet,
        character: state.project.characters[puppet],
        thumbnail: state.project.characterThumbnails[puppet],
        selected: state.controller.actors.some(id => state.actors.find(actor => actor.id === id).puppetId === puppet)
    }
}

const puppetTarget = {
    drop(props, monitor) {
        props.dispatch(setSlot(props.index, monitor.getItem().puppet))
    }
}

function collect(connect, monitor) {
    return {
        connectDropTarget: connect.dropTarget(),
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop()
    }
}

export default connect(mapStateToProps)(DropTarget('puppet', puppetTarget, collect)(Character))
