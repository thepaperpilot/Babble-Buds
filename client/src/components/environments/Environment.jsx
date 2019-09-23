import React, { Component } from 'react'
import { connect } from 'react-redux'
import InlineEdit from './../ui/InlineEdit'
import SmallThumbnail from './../ui/SmallThumbnail'
import { ContextMenuTrigger } from 'react-contextmenu'

class Environment extends Component {
    constructor(props) {
        super(props)

        this.inlineEdit = React.createRef()

        this.renameEnvironment = this.renameEnvironment.bind(this)
        this.editEnvironment = this.editEnvironment.bind(this)
    }

    renameEnvironment(name) {
        this.props.dispatch({
            type: 'CHANGE_ENVIRONMENT',
            environment: this.props.env,
            key: 'name',
            value: name
        })
    }

    editEnvironment() {
        if (this.props.env !== -1) {
            this.props.dispatch({
                type: 'EDIT_PUPPET',
                id: this.props.env,
                character: this.props.environment,
                objectType: 'environment'
            })
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
                    environment: this.props.env,
                    inlineEdit: this.inlineEdit,
                    disabled: this.props.env === -1
                })}>
                {this.props.small ?
                    <div>
                        <InlineEdit
                            ref={this.inlineEdit}
                            disabled={true}
                            target={this.props.env}
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
                            target={this.props.env}
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
    const environment = state.project.settings.environments[props.env] ||
            state.project.defaultEnvironment
    return {
        environment,
        thumbnail: state.project.characterThumbnails[environment.id]
    }
}

export default connect(mapStateToProps)(Environment)
