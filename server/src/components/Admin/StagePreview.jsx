import React, { Component } from 'react'
import ResizeObserver from 'react-resize-observer'
import babble from 'babble.js'

export default class StagePreview extends Component {
    constructor(props) {
        super(props)

        this.stageContainer = React.createRef()

        this.resize = this.resize.bind(this)
        this.loaded = this.loaded.bind(this)
    }

    componentDidMount() {
        const { environment, assets, assetPaths } = this.props.room
        let updatedAssets = Object.keys(assets).reduce((acc, curr) => {
            return {
                ...acc,
                [curr]: {
                    ...assets[curr],
                    location: assetPaths[curr]
                }
            }
        }, {})
        this.stage = new babble.Stage('stage-preview', environment, updatedAssets, '', this.loaded)
    }

    componentWillReceiveProps(newProps) {
        // Update environment
        if (this.props.room.environment !== newProps.room.environment) {
            console.log('environment updated')
            this.stage.environment = newProps.room.environment
            this.stage.resize()
            this.stage.updateEnvironment()
        }
        // Update assets
        if (this.props.room.assets !== newProps.room.assets) {
            console.log('assets updated')
            this.stage.assets = newProps.room.assets
            this.stage.reloadPuppets()
        }

        // If we haven't loaded our puppets in yet, ignore actor changes
        if (this.puppets == null)
            return

        // Add actors
        Object.keys(newProps.room.puppets).filter(id => !(id in this.puppets)).forEach(id => {
            console.log('add actor', id)
            const actor = newProps.room.puppets[id]
            const character = Object.assign({}, actor.character, {
                position: actor.position,
                emote: actor.emote,
                facingLeft: actor.facingLeft
            })
            this.puppets[id] = this.stage.addPuppet(character, id)
        })
        // Remove actors
        Object.keys(this.puppets).filter(id => !(id in newProps.room.puppets)).forEach(id => {
            console.log('remove actor', id)
            this.stage.removePuppet(id)
            delete this.puppets[id]
        })
        // Update actors
        Object.keys(newProps.room.puppets).filter(id => id in this.puppets).forEach(id => {
            const newActor = newProps.room.puppets[id]
            const oldActor = this.props.room.puppets[id]
            console.log('update actor', newActor, oldActor)
            if (oldActor == null) return
            const puppet = this.puppets[id]
            if (oldActor.emote !== newActor.emote)
                puppet.changeEmote(newActor.emote)
            if (oldActor.position !== newActor.position)
                puppet.target = newActor.position
            if (oldActor.facingLeft !== newActor.facingLeft) {
                puppet.facingLeft = newActor.facingLeft
                if (puppet.movingAnim === 0)
                    puppet.container.scale.x = (newActor.facingLeft ? -1 : 1) *
                        (newProps.room.environment.puppetScale || 1)
            }
            if (oldActor.character !== newActor.character) {
                console.log('updated character')
                const tempPuppet = this.stage.createPuppet(newActor.character)
                this.puppets[newActor.id] =
                    this.stage.setPuppet(id, tempPuppet)
            }
            this.stage.dirty = true
        })
    }

    resize(rect) {
        const environment = this.props.room.environment
        let width = rect.width
        let ratio = environment.height / environment.width
        let height = width * ratio
        if (this.stage) {
            this.stage.resize(null, width, height)
            this.stage.updateEnvironment()
        } else
            this.bounds = { width, height }
    }

    loaded() {
        this.stage.renderer.view.style.position = ''
        if (this.bounds) {
            this.stage.resize(null, this.bounds.width, this.bounds.height)
            this.stage.updateEnvironment()
        }

        this.puppets = {}
        Object.keys(this.props.room.puppets).forEach(id => {
            const actor = this.props.room.puppets[id]
            console.log(actor)
            const character = Object.assign({}, actor.character, {
                position: actor.position,
                emote: actor.emote,
                facingLeft: actor.facingLeft
            })
            this.puppets[id] = this.stage.addPuppet(character, id)
        })
    }

    render() {
        return <div className="section">
            <div id="stage-preview"></div>
            <ResizeObserver onResize={this.resize} />
        </div>
    }
}
