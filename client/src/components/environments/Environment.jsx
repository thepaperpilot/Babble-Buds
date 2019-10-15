import React, { Component } from 'react'
import { connect } from 'react-redux'
import { ContextMenuTrigger } from 'react-contextmenu'
import InlineEdit from '../ui/InlineEdit'
import { open } from '../../redux/editor/editor'
import { changeEnvironment } from '../../redux/project/environments'

class Environment extends Component {
    constructor(props) {
        super(props)

        this.inlineEdit = React.createRef()

        this.renameEnvironment = this.renameEnvironment.bind(this)
        this.editEnvironment = this.editEnvironment.bind(this)
    }

    renameEnvironment(name) {
        this.props.dispatch(changeEnvironment(this.props.id, { name }))
    }

    editEnvironment() {
        if (this.props.id !== -1) {
            this.props.dispatch(open(this.props.id, this.props.environment.layers, 'environment'))
        }
    }

    render() {
        const {name, color, width, height} = this.props.environment
        
        const style = {
            backgroundColor: color
        }

        const ratio = (this.props.width - 4) / (this.props.height - 20)
        if (width / height > ratio) {
            style.width = '100%'
            const desiredHeight = (this.props.width - 4) * height / width
            const remainingHeight = this.props.height - 20 - desiredHeight
            style.margin = `${50 * remainingHeight / (this.props.width - 4)}% 0`
        } else {
            style.height = 'calc(100% - 16px)'
            style.width = 'auto'
            const desiredWidth = (this.props.height - 20) * width / height
            const remainingWidth = this.props.width - 4 - desiredWidth
            style.margin = `0 ${50 * remainingWidth / (this.props.width - 4)}%`
        }

        return <div>
            <ContextMenuTrigger
                id={`contextmenu-environment-${this.props.contextmenu}`}
                holdToDisplay={-1}
                collect={() => ({
                    environment: this.props.id,
                    inlineEdit: this.inlineEdit,
                    disabled: this.props.id === -1
                })}>
                {this.props.small ?
                    <div>
                        <InlineEdit
                            ref={this.inlineEdit}
                            disabled={true}
                            target={this.props.id}
                            targetType="environment"
                            label={name}
                            className="line-item smallThumbnail-wrapper"
                            onChange={this.renameEnvironment}
                            onDoubleClick={this.editEnvironment}>
                            <div className="smallThumbnail-img" style={{width: '20px', height: '20px'}}>
                                <img
                                    style={style}
                                    alt={name}
                                    src={this.props.thumbnail}/>
                            </div>
                        </InlineEdit>
                    </div> :
                    <div>
                        <InlineEdit
                            ref={this.inlineEdit}
                            disabled={true}
                            target={this.props.id}
                            targetType="environment"
                            label={name}
                            className="char"
                            width={this.props.width}
                            height={this.props.height}
                            onChange={this.renameEnvironment}
                            onDoubleClick={this.editEnvironment}>
                            <img
                                style={style}
                                alt={name}
                                src={this.props.thumbnail} />
                        </InlineEdit>
                    </div>
                }
            </ContextMenuTrigger>
        </div>
    }
}

function mapStateToProps(state, props) {
    return {
        thumbnail: state.project.characterThumbnails[props.id]
    }
}

export default connect(mapStateToProps)(Environment)
