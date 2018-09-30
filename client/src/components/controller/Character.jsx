import React, {Component} from 'react'
import { connect } from 'react-redux'
import { DropTarget } from 'react-dnd'
import classNames from 'classnames'
import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu'

const path = window.require('path')
const fs = window.require('fs-extra')

class Character extends Component {
    constructor(props) {
        super(props)

        this.changePuppet = this.changePuppet.bind(this)
        this.clear = this.clear.bind(this)
    }

    changePuppet(index) {
        return () => this.props.dispatch({
            type: 'CHANGE_PUPPET_SELF',
            index
        })
    }

    clear() {
        return () => {
            if (this.props.id === this.props.hotbar[this.props.index]) {
                this.props.dispatch({
                    type: 'ERROR',
                    content: 'Can\'t clear active hotbar slot. Please switch to a different slot and try again.'
                })
            } else {
                this.props.dispatch({
                    type: 'SET_HOTBAR_SLOT',
                    index: this.props.index,
                    puppet: 0
                })
            }
        }
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
            return this.props.connectDropTarget(
                <div>
                    <ContextMenuTrigger id={`contextmenu-character-${this.props.index}`} holdToDisplay={-1}>
                        <div className={classNames(className)}>
                            <div className="hotkey"></div>
                            <div className="desc"></div>
                        </div>
                    </ContextMenuTrigger>
                </div>
            )
        }
        className.selected = this.props.id === this.props.hotbar[this.props.index]
        const imageSource = this.props.characterThumbnails[this.props.hotbar[this.props.index]]
        return (
            <div>
                <ContextMenuTrigger id={`contextmenu-character-${this.props.index}`} holdToDisplay={-1}>
                    <div
                        data-index={this.props.index}
                        className={classNames(className)}
                        onClick={this.changePuppet(this.props.index)}>
                        <div className="hotkey">{this.props.index + 1}</div>
                        <div className="desc">{character.name}</div>
                        {this.props.connectDropTarget(<img alt={character.name} src={imageSource}/>)}
                    </div>
                </ContextMenuTrigger>
                <ContextMenu id={`contextmenu-character-${this.props.index}`}>
                    <MenuItem onClick={this.clear}>Clear Slot</MenuItem>
                </ContextMenu>
            </div>
        )
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
