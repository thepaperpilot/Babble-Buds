import React, {Component} from 'react'
import { connect } from 'react-redux'
import { DropTarget } from 'react-dnd'
import classNames from 'classnames'
import { ContextMenuTrigger } from 'react-contextmenu'

class Character extends Component {
    constructor(props) {
        super(props)

        this.changePuppet = this.changePuppet.bind(this)
    }

    changePuppet(index) {
        return () => this.props.dispatch({
            type: 'CHANGE_PUPPET_SELF',
            index
        })
    }

    render() {
        const character = this.props.characters[this.props.hotbar[this.props.index]]
        const className = {
            'char': true,
            'selector': true,
            'isOver': this.props.isOver,
            'canDrop': this.props.canDrop
        }
        if (!character) {
            return this.props.connectDropTarget(<div className="react-contextmenu-wrapper">
                <div className={classNames(className)}>
                    <div className="hotkey"></div>
                    <div className="desc"></div>
                </div>
            </div>)
        }
        className.selected = this.props.id === this.props.hotbar[this.props.index]
        const imageSource = this.props.characterThumbnails[this.props.hotbar[this.props.index]]
        return <ContextMenuTrigger
            id={`contextmenu-character-${this.props.contextmenu}`}
            holdToDisplay={-1}
            collect={() => ({
                index: this.props.index,
                puppet: this.props.hotbar[this.props.index],
                character
            })}>
            {this.props.connectDropTarget(<div
                data-index={this.props.index}
                className={classNames(className)}
                onClick={this.changePuppet(this.props.index)}>
                <div className="hotkey">{this.props.index + 1}</div>
                <div className="desc">{character.name}</div>
                <img alt={character.name} src={imageSource}/>
            </div>)}
        </ContextMenuTrigger>
    }
}

function mapStateToProps(state) {
    return {
        hotbar: state.project.settings.hotbar,
        characters: state.project.characters,
        characterThumbnails: state.project.characterThumbnails,
        id: state.project.settings.actor.id
    }
}

const puppetTarget = {
    drop(props, monitor) {
        props.dispatch({
            type: 'SET_HOTBAR_SLOT',
            index: props.index,
            puppet: monitor.getItem().puppet
        })
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
