import React, {Component} from 'react'
import { ContextMenuTrigger } from 'react-contextmenu'
import './dropdown.css'

class InspectorDropdown extends Component {
    constructor(props) {
        super(props)

        this.state = {
            folded: true
        }

        this.button = React.createRef()
        this.trigger = React.createRef()

        this.onShow = this.onShow.bind(this)
        this.onHide = this.onHide.bind(this)
        this.toggleMenu = this.toggleMenu.bind(this)
    }

    onShow() {
        this.setState({
            folded: false
        })
    }

    onHide() {
        this.setState({
            folded: true
        })
    }

    toggleMenu(e) {
        const rect = this.button.current.getBoundingClientRect()
        e.clientX = rect.x + rect.width + 1
        e.clientY = rect.y + rect.height - 5
        if (this.state.folded)
            this.trigger.current.handleContextClick(e)
        e.preventDefault()
    }

    render() {
        const ContextMenu = this.props.menu
        return <div className="dropdown-wrapper" onMouseDown={this.toggleMenu}>
            <ContextMenu onShow={this.onShow} onHide={this.onHide} />
            <ContextMenuTrigger
                id={this.props.id}
                holdToDisplay={-1}
                collect={this.props.collect}
                ref={this.trigger}>
                <div />
            </ContextMenuTrigger>
            <button
                className={this.state.folded ?
                    'dropdown-image' : 'dropdown-image active'}
                title="Dropdown"
                ref={this.button} >
                ⚙
            </button>
        </div>
    }
}

export default InspectorDropdown
