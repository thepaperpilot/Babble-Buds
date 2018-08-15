import React, {Component} from 'react'
import About from './About'
import Instructions from './Instructions'
import './modals.css'

const electron = window.require('electron')

class Modals extends Component {
    componentDidMount() {
        electron.ipcRenderer.on('toggleAbout', () => {
            this.toggleModal('#about')
        })
        electron.ipcRenderer.on('toggleInstructions', () => {
            this.toggleModal('#instructions')
        })
        this.modal = new (require('vanilla-modal').default)()
    }

    toggleModal(name) {
        if (this.modal.isOpen)
            this.modal.close()
        else
            this.modal.open(name)
    }

    render() {
        return (
            <div>
                <About/>
                <Instructions/>
                <div className="modal">
                    <div className="modal-inner">
                        <div className="modal-content"></div>
                    </div>
                </div>
            </div>
        )
    }
}

export default Modals
