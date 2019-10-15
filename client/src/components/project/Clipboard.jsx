import { Component } from 'react'
import { connect } from 'react-redux'
import { error } from '../../redux/status'
import { addLayer, deleteLayer } from '../../redux/editor/layers'

const electron = window.require('electron')

class Clipboard extends Component {
    constructor(props) {
        super(props)

        this.cut = this.cut.bind(this)
        this.copy = this.copy.bind(this)
        this.paste = this.paste.bind(this)
        this.delete = this.delete.bind(this)
        this.keyDown = this.keyDown.bind(this)
    }

    componentDidMount() {
        window.addEventListener('keydown', this.keyDown)
        electron.ipcRenderer.on('cut', this.cut)
        electron.ipcRenderer.on('copy', this.copy)
        electron.ipcRenderer.on('paste', this.paste)
        electron.ipcRenderer.on('delete', this.delete)
    }

    componentWillUnmount() {
        window.removeEventListener('keydown', this.keyDown)
        electron.ipcRenderer.off('cut', this.cut)
        electron.ipcRenderer.off('copy', this.copy)
        electron.ipcRenderer.off('paste', this.paste)
        electron.ipcRenderer.off('delete', this.delete)
    }

    cut() {
        this.copy()
        this.delete()
    }

    copy() {
        if (this.props.id != null && this.props.layer != null) {
            let curr = this.props.layers
            this.props.layer.forEach(index => {
                if (curr == null) return
                curr = curr.children[index]
            })
            electron.clipboard.writeText(JSON.stringify(curr))
        }
    }

    paste() {
        if (this.props.id != null) {
            try {
                const layer = JSON.parse(electron.clipboard.readText())
                let l = this.props.layer || []

                let curr = this.props.layers;
                (l || []).forEach((index, i) => {
                    if (curr.children[index] != null)
                        curr = curr.children[index]
                    else l = l.slice(0, i)
                })

                const path = curr.id ? l.slice(0, -1) : l
                this.props.dispatch(addLayer(path, layer))
            } catch (e) {
                this.props.dispatch(error('Failed to paste layer', e))
            }
        }
    }

    delete() {
        if (this.props.id != null && this.props.layer != null) {
            this.props.dispatch(deleteLayer(this.props.layer))
        }
    }

    keyDown(e) {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA'))
            return

        if (!e.ctrlKey && e.keyCode !== 46)
            return

        switch (e.keyCode) {
        case 88: this.cut(); break
        case 67: this.copy(); break
        case 86: this.paste(); break
        case 46: this.delete(); break
        default:
        }
    }

    render() {
        return null
    }
}

function mapStateToProps(state) {
    return {
        id: state.editor.present.id,
        layer: state.editor.present.selected.layer,
        layers: state.editor.present.layers
    }
}

export default connect(mapStateToProps)(Clipboard)
