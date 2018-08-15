import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import cx from 'classnames'
import './modal.css'

function stopPropagation(e) {
    e.stopPropagation()
}

class Modal extends Component {
    static root = document.getElementById('modal-root')
    render() {
        const backdropClasses = ['modal-backdrop']
        if(this.props.open) {
            backdropClasses.push('open')
        }

        return ReactDOM.createPortal(
            <div className={cx(backdropClasses)} onClick={this.props.onClose}>
                <div className="modal" onClick={stopPropagation} style={this.props.style}>
                    <div className="title">{this.props.title}</div>
                    <div className="modal-content">
                        {this.props.children}

                        <div className="footer flex-row">
                            {this.props.footer}
                            <button onClick={this.props.onClose}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>,
            Modal.root
        )
    }
}

export default Modal
