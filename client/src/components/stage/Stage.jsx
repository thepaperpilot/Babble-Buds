import React, { Component } from 'react'
import ReactResizeDetector from 'react-resize-detector'
import { connect } from 'react-redux'
import { info, log, warn, error } from '../../redux/status'
import { inspect } from '../../redux/inspector'

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
    }

    componentDidMount() {
        this.stage = new babble.Stage(`screen${this.props.id}`, this.props.environment, this.props.assets, this.props.assetsPath, null, Object.assign({}, console, {
            info: this.info,
            warn: this.warn,
            log: this.log,
            error: this.error
        }))
        this.registerPuppetLoader()
    }

    componentWillUnmount() {
        if (this.regPuppetLoader)
            clearTimeout(this.regPuppetLoader)
        this.stage.enabled = false
    }

    // TODO I had to start stringifying things to make the popout not give false === negatives
    // Find a faster way to handle that
    componentWillReceiveProps(newProps) {
        // Update environment
        if (JSON.stringify(this.props.environment) !== JSON.stringify(newProps.environment)) {
            this.stage.environment = newProps.environment
            this.stage.resize()
            this.stage.updateEnvironment()
        }
        // Update assets
        if (JSON.stringify(this.props.assets) !== JSON.stringify(newProps.assets) ||
            this.props.assetsPath !== newProps.assetsPath) {
            this.stage.assets = newProps.assets
            this.stage.assetsPath = newProps.assetsPath
            this.stage.reloadPuppets()
        }

        // If we haven't loaded our puppets in yet, ignore actor changes
        if (!this.stage.puppets.length)
            return

        // Add actors
        newProps.actors.filter(actor => !(actor.id in this.stage.puppets)).forEach(actor => {
            const character = Object.assign({}, actor.character, {
                position: actor.position,
                emote: actor.emote,
                facingLeft: actor.facingLeft
            })
            this.stage.addPuppet(character, actor.id)
        })
        // Remove actors
        Object.keys(this.stage.puppets).filter(id => !newProps.actors.some(a => a.id == id)).forEach(id => {
            this.stage.removePuppet(id)
        })
        // Update actors
        newProps.actors.filter(actor => actor.id in this.stage.puppets).forEach(newActor => {
            const old = this.props.actors.find(actor => actor.id == newActor.id)
            if (old == null) return
            if (JSON.stringify(old.character) !== JSON.stringify(newActor.character)) {
                const tempPuppet = this.stage.createPuppet(newActor.character)
                this.stage.puppets[newActor.id] =
                    this.stage.setPuppet(newActor.id, tempPuppet)
            }
            if (old.emote !== newActor.emote)
                this.stage.puppets[newActor.id].changeEmote(newActor.emote)
            if (old.position !== newActor.position)
                this.stage.puppets[newActor.id].target = newActor.position
            if (old.facingLeft !== newActor.facingLeft) {
                this.stage.puppets[newActor.id].facingLeft = newActor.facingLeft
                if (this.stage.puppets[newActor.id].movingAnim === 0)
                    this.stage.puppets[newActor.id].container.scale.x = (newActor.facingLeft ? -1 : 1) *
                        (newProps.environment.puppetScale || 1)
            }
            if (old.babbling !== newActor.babbling)
                this.stage.puppets[newActor.id].setBabbling(newActor.babbling)
            if (old.jiggle !== newActor.jiggle)
                this.stage.puppets[newActor.id].jiggle()
            this.stage.dirty = true
        })
        if (this.props.banish !== newProps.banish)
            this.stage.banishPuppets()
        this.stage.gameLoop()
    }

    info(content) {
        this.props.dispatch(info(content))
    }

    warn(content) {
        this.props.dispatch(warn(content))
    }

    log(content) {
        this.props.dispatch(log(content))
    }

    error(err) {
        this.props.dispatch(error('Error occured in babble.js', err))
    }

    registerPuppetLoader() {
        if (this.props.assetUpdater) {
            this.props.assetUpdater.addPuppetLoader(this.loadPuppets)
            this.regPuppetLoader = null
        } else
            this.regPuppetLoader = requestAnimationFrame(this.registerPuppetLoader)
    }

    onResize() {
        this.stage.resize()
    }

    loadPuppets() {
        this.stage.registerPuppetListener('mousedown', (e) => {
            this.props.dispatch(inspect(e.target.puppet.puppet.id, 'puppet-network'))
        })

        this.props.actors.forEach(curr => {
            const character = Object.assign({}, curr.character, {
                position: curr.position,
                emote: curr.emote,
                facingLeft: curr.facingLeft
            })
            this.stage.addPuppet(character, curr.id)
        }, {})
    }

    render() {
        return (
            <div id={`screen${this.props.id}`} style={{
                width: '100%',
                height: '100%'}}>
                <ReactResizeDetector handleWidth handleHeight onResize={this.onResize} />
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        controlled: state.controller.actors,
        environment: state.environment,
        assets: state.project.assets,
        assetsPath: state.project.assetsPath,
        actors: state.actors,
        banish: state.networking.banish
    }
}

export default connect(mapStateToProps, null, null, { forwardRef: true })(Stage)
