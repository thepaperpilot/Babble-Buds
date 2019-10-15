import React, {Component} from 'react'
import { connect } from 'react-redux'
import { ActionCreators as UndoActionCreators } from 'redux-undo'
import AssetUpdater from './AssetUpdater'
import Clipboard from './Clipboard'
import BabbleToggle from './BabbleToggle'
import BackgroundInterface from './BackgroundInterface'
import Themer from './Themer'
import Panels from '../panels/Panels'
import { log, inProgressIncrement } from '../../redux/status'
import { setEmote, moveLeft, moveRight, jiggle, changePuppet, setBabbling } from '../../redux/controller'
import { addAssets } from '../../redux/project/assets/actions'
import { addCharacter } from '../../redux/project/characters/actions'

const electron = window.require('electron')
const actions = { moveLeft, moveRight, jiggle, changePuppet, setEmote }

class Project extends Component {
    constructor(props) {
        super(props)

        this.assetUpdater = React.createRef()

        this.keyDown = this.keyDown.bind(this)
        this.keyUp = this.keyUp.bind(this)
        this.dispatchPassthrough = this.dispatchPassthrough.bind(this)
        this.undo = this.undo.bind(this)
        this.redo = this.redo.bind(this)
        this.importAssets = this.importAssets.bind(this)
        this.importPuppet = this.importPuppet.bind(this)
    }

    componentDidMount() {
        this.props.dispatch(log('Loading Project...'))

        window.addEventListener('keydown', this.keyDown)
        window.addEventListener('keyup', this.keyUp)
        electron.ipcRenderer.on('dispatch', this.dispatchPassthrough)
        electron.ipcRenderer.on('undo', this.undo)
        electron.ipcRenderer.on('redo', this.redo)
        electron.ipcRenderer.on('import assets', this.importAssets)
        electron.ipcRenderer.on('import puppet', this.importPuppet)

        // rerender now that our AssetUpdater prop will be working
        this.setState({})
    }

    componentWillUnmount() {
        window.removeEventListener('keydown', this.keyDown)
        window.removeEventListener('keyup', this.keyUp)
        electron.ipcRenderer.removeListener('dispatch', this.dispatchPassthrough)
        electron.ipcRenderer.off('dispatch', this.undo)
        electron.ipcRenderer.off('dispatch', this.redo)
        electron.ipcRenderer.off('import assets', this.importAssets)
        electron.ipcRenderer.off('import puppet', this.importPuppet)
    }

    keyDown(e) {
        // Holding down emits events very quickly, and I want to ignore those
        if (e.repeat) return

        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA'))
            return

        if (e.keyCode == 32) {
            this.props.dispatch(setBabbling(true))
            if (e.preventDefault) e.preventDefault()
        }
    }

    keyUp(e) {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA'))
            return
        
        if (e.keyCode > 48 && e.keyCode < 58) {
            this.props.dispatch(changePuppet(e.keyCode - 49))
        } else switch(e.keyCode) {
        case 32: this.props.dispatch(setBabbling(false)); break
        case 85: this.props.dispatch(setEmote(0)); break
        case 73: this.props.dispatch(setEmote(1)); break
        case 79: this.props.dispatch(setEmote(2)); break
        case 80: this.props.dispatch(setEmote(3)); break
        case 74: this.props.dispatch(setEmote(4)); break
        case 75: this.props.dispatch(setEmote(5)); break
        case 76: this.props.dispatch(setEmote(6)); break
        case 186: this.props.dispatch(setEmote(7)); break
        case 77: this.props.dispatch(setEmote(8)); break
        case 188: this.props.dispatch(setEmote(9)); break
        case 190: this.props.dispatch(setEmote(10)); break
        case 191: this.props.dispatch(setEmote(11)); break
        case 37: this.props.dispatch(moveLeft()); break
        case 39: this.props.dispatch(moveRight()); break
        case 38:case 66: this.props.dispatch(jiggle()); break
        default: break
        }
    }

    dispatchPassthrough(e, action, data) {
        this.props.dispatch(actions[action](data))
    }

    undo() {
        this.props.dispatch(UndoActionCreators.undo())
    }

    redo() {
        this.props.dispatch(UndoActionCreators.redo())
    }

    importAssets(e, assets, statusId) {
        this.props.dispatch(addAssets(assets))
        this.props.dispatch(inProgressIncrement(statusId, Object.keys(assets).length))
    }

    importPuppet(e, id, puppet, statusId) {
        this.props.dispatch(addCharacter(id, puppet))
        this.props.dispatch(inProgressIncrement(statusId))
    }

    render() {
        // The asset updater needs to be updated before any Stage panels, so we put it above the panels component
        return this.assetUpdater.current ? <div>
            <AssetUpdater ref={this.assetUpdater} />
            <Panels assetUpdater={this.assetUpdater.current} />
            <Clipboard/>
            <BabbleToggle />
            <BackgroundInterface />
            <Themer />
        </div> : <div>
            <AssetUpdater ref={this.assetUpdater} />
        </div>
    }
}

export default connect()(Project)
