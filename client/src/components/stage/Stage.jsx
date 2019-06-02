import React, {Component} from 'react'
import ReactResizeDetector from 'react-resize-detector'
import { connect } from 'react-redux'

const babble = require('babble.js')

class Stage extends Component {
    constructor(props) {
        super(props)

        this.info = this.info.bind(this)
        this.warn = this.warn.bind(this)
        this.log = this.log.bind(this)
        this.error = this.error.bind(this)

        this.registerPuppetLoader = this.registerPuppetLoader.bind(this)
        this.onResize = this.onResize.bind(this)
        this.loadPuppets = this.loadPuppets.bind(this)
        this.jiggle = this.jiggle.bind(this)
    }

    componentDidMount() {
        this.stage = new babble.Stage('screen', this.props.settings, this.props.assets, this.props.assetsPath, null, Object.assign({}, console, {
            info: this.info,
            warn: this.warn,
            log: this.log,
            error: this.error
        }))
        this.props.addJiggleListener(this.jiggle)
        this.registerPuppetLoader()
    }

    componentWillUnmount() {
        this.props.removeJiggleListener(this.jiggle)
    }

    componentWillReceiveProps(newProps) {
        if (this.props.settings !== newProps.settings) {
            this.stage.project = newProps.settings
            this.stage.resize()
        }
        if (this.props.characters[this.props.actor.id] !==
            newProps.characters[newProps.actor.id]) {
            this.stage.removePuppet(this.props.self)
            this.addPuppet(newProps)
        }
        if (this.props.assets !== newProps.assets ||
            this.props.assetsPath !== newProps.assetsPath) {
            this.stage.assets = newProps.assets
            this.stage.assetsPath = newProps.assetsPath
            this.stage.reloadPuppets()
        }

        // Check for anything that requires this.puppet
        if (!this.puppet) return
        if (this.props.actor.emote !== newProps.actor.emote) {
            this.puppet.changeEmote(newProps.actor.emote)
        }
        if (this.props.actor.position !== newProps.actor.position) {
            this.puppet.target = newProps.actor.position
        }
        if (this.props.actor.facingLeft !== newProps.actor.facingLeft) {
            this.puppet.facingLeft = newProps.actor.facingLeft
            if (this.puppet.movingAnim === 0)
                this.puppet.container.scale.x = (newProps.actor.facingLeft ? -1 : 1) * (this.stage.project.puppetScale || 1)
        }
        if (this.props.babbling !== newProps.babbling) {
            this.puppet.setBabbling(newProps.babbling)
        }
    }

    info(content) {
        this.props.dispatch({
            type: 'INFO',
            content
        })
    }

    warn(content) {
        this.props.dispatch({
            type: 'WARN',
            content
        })
    }

    log(content) {
        this.props.dispatch({
            type: 'LOG',
            content
        })
    }

    error(error) {
        this.props.dispatch({
            type: 'ERROR',
            content: 'Error occured in babble.js',
            error
        })
    }

    registerPuppetLoader() {
        if (this.props.assetUpdater)
            this.props.assetUpdater.getWrappedInstance().addPuppetLoader(this.loadPuppets)
        else
            requestAnimationFrame(this.registerPuppetLoader)
    }

    onResize() {
        this.stage.resize()
    }

    loadPuppets(stage) {
        stage.registerPuppetListener('mousedown', (e) => {
            const {creator, id} = e.target.puppet.puppet
            this.props.dispatch({
                type: 'INSPECT',
                target: creator === this.props.self ? id : creator,
                targetType: 'puppet'
            })
        })

        this.addPuppet(this.props)
    }

    addPuppet(props) {
        if (props.characters[props.actor.id]) {
            const character = Object.assign({}, props.characters[props.actor.id])
            character.position = props.actor.position
            character.emote = props.actor.emote
            character.facingLeft = props.actor.facingLeft
            this.puppet = this.stage.addPuppet(character, props.self)
        }
    }

    jiggle() {
        if (this.puppet)
            this.puppet.jiggle()
    }

    render() {
        return (
            <div id="screen" style={{width: '100%', height: '100%', backgroundColor: this.props.settings.greenScreenEnabled ? this.props.settings.greenScreen : ''}}>
                <ReactResizeDetector handleWidth handleHeight onResize={this.onResize} />
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        settings: state.project.settings,
        assets: state.project.assets,
        assetsPath: state.project.assetsPath,
        characters: state.project.characters,
        actor: state.project.settings.actor,
        self: state.self,
        babbling: state.babbling
    }
}

export default connect(mapStateToProps)(Stage)
