import React, {Component} from 'react'
import { connect } from 'react-redux'
import { ActionCreators as UndoActionCreators } from 'redux-undo'
import Panels from './../panels/Panels'
import AssetUpdater from './AssetUpdater'
import Clipboard from './Clipboard'
import BabbleToggle from './BabbleToggle'
import BackgroundInterface from './BackgroundInterface'

const electron = window.require('electron')

class Project extends Component {
    constructor(props) {
        super(props)

        this.state = {
            jiggleListeners: []
        }

        this.assetUpdater = React.createRef()

        this.keyDown = this.keyDown.bind(this)
        this.keyUp = this.keyUp.bind(this)
        this.dispatchPassthrough = this.dispatchPassthrough.bind(this)
        this.undo = this.undo.bind(this)
        this.redo = this.redo.bind(this)
        this.importAssets = this.importAssets.bind(this)
        this.importPuppet = this.importPuppet.bind(this)
        this.addJiggleListener = this.addJiggleListener.bind(this)
        this.removeJiggleListener = this.removeJiggleListener.bind(this)
    }

    componentDidMount() {
        this.props.dispatch({
            type: 'LOG',
            content: 'Loading Project...'
        })

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
            this.props.dispatch({type: 'START_BABBLING_SELF'})
            if (e.preventDefault) e.preventDefault()
        }
    }

    keyUp(e) {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA'))
            return
        
        if (e.keyCode > 48 && e.keyCode < 58) {
            this.props.dispatch({
                type: 'CHANGE_PUPPET_SELF',
                index: e.keyCode - 49
            })
        } else switch(e.keyCode) {
        case 32: this.props.dispatch({type: 'STOP_BABBLING_SELF'}); break
        case 85: this.props.dispatch({type: 'SET_EMOTE_SELF', emote: 0}); break
        case 73: this.props.dispatch({type: 'SET_EMOTE_SELF', emote: 1}); break
        case 79: this.props.dispatch({type: 'SET_EMOTE_SELF', emote: 2}); break
        case 80: this.props.dispatch({type: 'SET_EMOTE_SELF', emote: 3}); break
        case 74: this.props.dispatch({type: 'SET_EMOTE_SELF', emote: 4}); break
        case 75: this.props.dispatch({type: 'SET_EMOTE_SELF', emote: 5}); break
        case 76: this.props.dispatch({type: 'SET_EMOTE_SELF', emote: 6}); break
        case 186: this.props.dispatch({type: 'SET_EMOTE_SELF', emote: 7}); break
        case 77: this.props.dispatch({type: 'SET_EMOTE_SELF', emote: 8}); break
        case 188: this.props.dispatch({type: 'SET_EMOTE_SELF', emote: 9}); break
        case 190: this.props.dispatch({type: 'SET_EMOTE_SELF', emote: 10}); break
        case 191: this.props.dispatch({type: 'SET_EMOTE_SELF', emote: 11}); break
        case 37: this.props.dispatch({type: 'MOVE_LEFT_SELF'}); break
        case 39: this.props.dispatch({type: 'MOVE_RIGHT_SELF'}); break
        case 38:case 66:
            this.props.dispatch({type: 'JIGGLE_SELF'})
            this.state.jiggleListeners.forEach(cb => cb())
            break
        }
    }

    dispatchPassthrough(e, action) {
        this.props.dispatch(action)
        if (action.type === 'JIGGLE_SELF')
            this.state.jiggleListeners.forEach(cb => cb())
    }

    undo() {
        this.props.dispatch(UndoActionCreators.undo())
    }

    redo() {
        this.props.dispatch(UndoActionCreators.redo())
    }

    importAssets(e, assets, statusId) {
        this.props.dispatch({
            type: 'ADD_ASSETS',
            assets
        })
        this.props.dispatch({
            type: 'IN_PROGRESS_INCREMENT',
            count: Object.keys(assets).length,
            id: statusId
        })
    }

    importPuppet(e, id, puppet, statusId) {
        this.props.dispatch({
            type: 'ADD_PUPPETS',
            puppets: {
                [id]: puppet
            }
        })
        this.props.dispatch({
            type: 'IN_PROGRESS_INCREMENT',
            id: statusId
        })
    }

    addJiggleListener(cb) {
        const jiggleListeners = this.state.jiggleListeners.slice()
        jiggleListeners.push(cb)
        this.setState({
            jiggleListeners
        })
    }

    removeJiggleListener(cb) {
        const jiggleListeners = this.state.jiggleListeners.slice()
        const index = jiggleListeners.indexOf(cb)
        if (index >= 0) {
            jiggleListeners.splice(index, 1)
            this.setState({
                jiggleListeners
            })
        }
    }

    render() {
        // I still need to pass down a jiggle listener, because redux doesn't have an event/messaging system for this kind of thing
        // The asset updater needs to be updated before any Stage panels, so we put it above the panels component
        return (
            <div>
                <AssetUpdater ref={this.assetUpdater} />
                <Panels addJiggleListener={this.addJiggleListener} removeJiggleListener={this.removeJiggleListener} assetUpdater={this.assetUpdater.current} />
                <Clipboard/>
                <BabbleToggle />
                <BackgroundInterface />
            </div>
        )
    }
}

export default connect()(Project)
