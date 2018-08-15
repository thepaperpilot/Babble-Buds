import React, { Component } from 'react'
import { connect } from 'react-redux'
import { DragSource } from 'react-dnd'
import SmallThumbnail from './../ui/SmallThumbnail'

class DraggablePuppet extends Component {
    constructor(props) {
        super(props)

        this.editPuppet = this.editPuppet.bind(this)
    }

    editPuppet() {
        this.props.dispatch({
            type: 'EDIT_PUPPET',
            id: parseInt(this.props.puppet, 10),
            character: this.props.puppets[this.props.puppet]
        })
    }

    render() {
        return <div>
            {this.props.connectDragSource(this.props.small ?
                <div
                    className="line-item"
                    onClick={this.props.openPuppet}
                    onDoubleClick={this.props.editPuppet}>
                    <SmallThumbnail
                        label={this.props.puppets[this.props.puppet].name}
                        image={this.props.puppetThumbnails[this.props.puppet]} />
                </div> :
                <div
                    className="char"
                    onClick={this.props.openPuppet}
                    onDoubleClick={this.editPuppet}>
                    <div className="desc">{this.props.puppets[this.props.puppet].name}</div>
                    <img alt={this.props.puppet} src={this.props.puppetThumbnails[this.props.puppet]}/>
                </div>)}

        </div>
    }
}

function mapStateToProps(state) {
    return {
        puppets: state.project.characters,
        puppetThumbnails: state.project.characterThumbnails
    }
}

const puppetSource = {
    beginDrag(props) {
        return { puppet: props.puppet }
    }
}

function collect(connect) {
    return {
        connectDragSource: connect.dragSource()
    }
}

export default connect(mapStateToProps, null, null, { withRef: true })(DragSource('puppet', puppetSource, collect)(DraggablePuppet))
