import React, { Component } from 'react'
import ReactResizeDetector from 'react-resize-detector'
import { connect } from 'react-redux'
import { info, log, warn, error } from '../../redux/status'
import { inspect } from '../../redux/inspector'

const babble = require('babble.js')

class Stage extends Component {
    constructor(props) {
        super(props)

        this.puppets = null

        this.info = this.info.bind(this)
        this.warn = this.warn.bind(this)
        this.log = this.log.bind(this)
        this.error = this.error.bind(this)

        this.registerPuppetLoader = this.registerPuppetLoader.bind(this)
        this.onResize = this.onResize.bind(this)
        this.loadPuppets = this.loadPuppets.bind(this)
    }

    componentDidMount() {
        this.stage = new babble.Stage(`screen${this.props.id}`, this.props.settings, this.props.assets, this.props.assetsPath, null, Object.assign({}, console, {
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
    }

    componentWillReceiveProps(newProps) {
        // Update environment
        if (this.props.settings !== newProps.settings) {
            this.stage.project = newProps.settings
            this.stage.resize()
        }
        // Update assets
        if (this.props.assets !== newProps.assets ||
            this.props.assetsPath !== newProps.assetsPath) {
            this.stage.assets = newProps.assets
            this.stage.assetsPath = newProps.assetsPath
            this.stage.reloadPuppets()
        }

        // If we haven't loaded our puppets in yet, ignore actor changes
        if (this.puppets == null)
            return

        // Add actors
        newProps.actors.filter(actor => !(actor.id in this.puppets)).forEach(actor => {
            const character = Object.assign({}, actor.character, {
                position: actor.position,
                emote: actor.emote,
                facingLeft: actor.facingLeft
            })
            this.puppets[actor.id] = this.stage.addPuppet(character, actor.id)
        })
        // Remove actors
        Object.keys(this.puppets).filter(id => !newProps.actors.some(a => a.id === id)).forEach(actor => {
            this.stage.removePuppet(actor.id)
            delete this.puppets[actor.id]
        })
        // Update actors
        newProps.actors.filter(actor => actor.id in this.puppets).forEach(newActor => {
            const old = this.props.actors.find(actor => actor.id === newActor.id)
            const puppet = this.puppets[newActor.id]
            if (old.emote !== newActor.emote)
                puppet.changeEmote(newActor.emote)
            if (old.position !== newActor.position)
                puppet.target = newActor.position
            if (old.facingLeft !== newActor.facingLeft) {
                puppet.facingLeft = newActor.facingLeft
                if (puppet.movingAnim === 0)
                    puppet.container.scale.x = (newActor.facingLeft ? -1 : 1) *
                        (newProps.settings.puppetScale || 1)
            }
            if (old.babbling !== newActor.babbling)
                puppet.setBabbling(newActor.babbling)
            if (old.jiggle !== newActor.jiggle)
                puppet.jiggle()
            if (old.character !== newActor.character) {
                const tempPuppet = this.stage.createPuppet(newActor.character)
                this.puppets[newActor.id] =
                    this.stage.setPuppet(newActor.id, tempPuppet)
            }
        })
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
            this.props.assetUpdater.getWrappedInstance().addPuppetLoader(this.loadPuppets)
            this.regPuppetLoader = null
        } else
            this.regPuppetLoader = requestAnimationFrame(this.registerPuppetLoader)
    }

    onResize() {
        this.stage.resize()
    }

    loadPuppets(stage) {
        stage.registerPuppetListener('mousedown', (e) => {
            this.props.dispatch(inspect(e.target.puppet.puppet.id, 'puppet-network'))
        })

        this.puppets = this.props.actors.reduce((acc, curr) => {
            const character = Object.assign({}, curr.character, {
                position: curr.position,
                emote: curr.emote,
                facingLeft: curr.facingLeft
            })
            return {
                ...acc,
                [curr.id]: this.stage.addPuppet(character, curr.id)
            }
        }, {})
    }

    render() {
        return (
            <div id={`screen${this.props.id}`} style={{
                width: '100%',
                height: '100%',
                backgroundColor: this.props.settings.color}
            }>
                <ReactResizeDetector handleWidth handleHeight onResize={this.onResize} />
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        controlled: state.controller.actors,
        settings: state.environment,
        assets: state.project.assets,
        assetsPath: state.project.assetsPath,
        actors: state.actors
    }
}

export default connect(mapStateToProps)(Stage)
