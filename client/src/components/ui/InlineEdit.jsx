import React, {Component} from 'react'
import { connect } from 'react-redux'
import classNames from 'classnames'
import './inline-edit.css'

class InlineEdit extends Component {
    constructor(props) {
        super(props)

        this.input = React.createRef()

        this.state = {
            text: props.target,
            isEditing: false,
            editClick: false
        }

        this.onChange = this.onChange.bind(this)
        this.onBlur = this.onBlur.bind(this)
        this.onClick = this.onClick.bind(this)
        this.onInputClick = this.onInputClick.bind(this)
        this.edit = this.edit.bind(this)
    }

    onChange(e) {
        this.setState({
            text: e.target.value
        })
    }

    onBlur() {
        if (this.state.text !== (this.props.label || this.props.target))
            this.props.onChange(this.state.text)
        
        this.setState({
            isEditing: false
        })
    }

    onClick(e) {
        const {targetType, selected, target, dispatch, disabled, selectable} = this.props

        if (this.state.isEditing) return

        if (selected && !disabled)
            this.edit()
        else if (selectable !== false) {
            dispatch({
                type: 'INSPECT',
                targetType: targetType,
                target: target
            })
        }
    }

    onInputClick(e) {
        if (e.detail === 2 && this.state.editClick && this.props.onDoubleClick) {
            this.props.onDoubleClick(e)
            this.setState({
                isEditing: false
            })
        } else
            this.setState({
                editClick: false
            })
    }

    edit() {
        this.setState({
            isEditing: true,
            text: this.props.label || this.props.target,
            editClick: true
        }, () => {
            this.input.current.focus()
        })
    }

    render() {
        const {className, selected, target, style, disabled, label} = this.props

        return <div
            className={classNames(className, {
                selected,
                disabled,
                isEditing: this.state.isEditing
            })}
            onClick={this.onClick}
            onDoubleClick={this.props.onDoubleClick}>
            {this.props.children}
            {this.state.isEditing ?
                <input
                    className="inline-edit"
                    style={style}
                    value={this.state.text}
                    onChange={this.onChange}
                    onBlur={this.onBlur}
                    onKeyPress={e => { if (e.key === 'Enter') this.onBlur() }}
                    onClick={this.onInputClick}
                    ref={this.input} /> :
                <div className="inner-line-item"
                    style={style}>
                    {label || target}
                </div>
            }
        </div>
    }
}

function mapStateToProps(state, props) {
    return {
        selected: props.targetType === state.inspector.targetType &&
            props.target === state.inspector.target
    }
}

export default connect(mapStateToProps, null, null, {
    withRef: true
})(InlineEdit)
