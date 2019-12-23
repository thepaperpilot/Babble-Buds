import React, { Component } from 'react'
import babble from 'babble.js'
import assets from './assets.json'
import gravy from './gravy.json'
import script from './script.json'
 
export default class Stage extends Component {
    constructor(props) {
        super(props)

        this.state = {
            isChatting: false,
            message: 'This is Babble Buds, a Virtual Puppet Show Program!',
            textPos: 0,
            showControls: false,
            babbling: false,
            babblingHidden: false,
            babbleX: 0,
            babbleY: 0
        }

        this.updateBabble = this.updateBabble.bind(this)
        this.loaded = this.loaded.bind(this)
        this.chatter = this.chatter.bind(this)
    }

    componentDidMount() {
        const env = {
            numCharacters: 3,
            puppetScale: 1.5,
            width: 1,
            height: 1
        }

        this.stage = new babble.Stage('stage', env, assets, 'assets', this.loaded)
        setTimeout(() => this.setState({ showControls: true }), 4000)

        window.onkeydown = function(e) {
            let key = e.keyCode ? e.keyCode : e.which
            if (this.state.isChatting)
                this.setState({ isChatting: false })

            if (key == 32) {
                e.preventDefault()
                if (this.stage.getPuppet(1).babbling) return
                this.stage.getPuppet(1).setBabbling(true)
                this.setState({ babbling: false },
                    () => this.setState({ babbling: true, babblingHidden: false }))
                this.interval = requestAnimationFrame(this.updateBabble)
            }
        }.bind(this)
        window.onkeyup = function(e) {
            let key = e.keyCode ? e.keyCode : e.which

            if (key > 48 && key < 58)
                this.stage.getPuppet(1).changeEmote(key - 49)
            else if (key == 37) {
                const puppet = this.stage.getPuppet(1)
                if (puppet.facingLeft || puppet.position % 4 === 0) {
                    puppet.target--
                } else {
                    if (puppet.movingAnim === 0)
                        puppet.container.scale.x = -1 * this.stage.environment.puppetScale
                }
                puppet.facingLeft = true
                this.stage.dirty = true
            } else if (key == 38) this.stage.getPuppet(1).jiggle()
            else if (key == 39) {
                const puppet = this.stage.getPuppet(1)
                if (puppet.facingLeft && puppet.position % 4 !== 0) {
                    if (puppet.movingAnim === 0)
                        puppet.container.scale.x = this.stage.environment.puppetScale
                } else {
                    puppet.target++
                }
                puppet.facingLeft = false
                this.stage.dirty = true
            } else if (key == 32) {
                this.stage.getPuppet(1).setBabbling(false)
                this.setState({ babblingHidden: true })
                cancelAnimationFrame(this.interval)
                e.preventDefault()
            }
        }.bind(this)
    }

    updateBabble() {
        const puppet = this.stage.getPuppet(1)
        let x = puppet.container.x + 150
        const y = puppet.container.y - 400
        if (puppet.facingLeft)
            x -= 450
        if (this.state.babbleX !== x || this.state.babbleY !== y)
            this.setState({
                babbleX: x,
                babbleY: y
            })
        this.interval = requestAnimationFrame(this.updateBabble)
    }

    loaded() {
        this.stage.resize()
        let puppetScale = this.stage.screen.clientHeight / 567 / this.stage.puppetStage.scale.y
        this.stage.environment.puppetScale = puppetScale
        this.stage.resize()
        
        window.onresize = () => {
            this.stage.resize()
            let puppetScale = this.stage.screen.clientHeight / 567 / this.stage.puppetStage.scale.y
            this.stage.environment.puppetScale = puppetScale
            this.stage.resize()
        }

        let cutscene = new babble.Cutscene(this.stage, script, { gravy })
        const stage = this
        cutscene.actions.chat = function(callback, action) {
            stage.setState({
                isChatting: true,
                textPos: 0
            })
            stage.stage.getPuppet(action.target).setBabbling(true)
            stage.chatter(callback, action.target)
        }
        cutscene.start()
    }

    chatter(callback, target) {
        const textPos = this.state.textPos
        if (textPos > this.state.message.length) {
            this.stage.getPuppet(target).setBabbling(false)
        } else {
            this.setState({
                textPos: textPos + 1
            })
            setTimeout(() => {this.chatter(callback, target)}, 20)
        }
    }

    render() {
        return <React.Fragment>
            <div id="stage">
                <div id="current_chat" style={{ display: this.state.isChatting ? 'block' : 'none' }}>
                    {this.state.message.substring(0, this.state.textPos)}_
                </div>
                {this.state.babbling ? <div id="babble"
                    className={this.state.babblingHidden ? 'hidden' : '' }
                    style={{ top: `${this.state.babbleY}px`, left: `${this.state.babbleX}px` }} >
                    <div style={{ animationDelay: '0s', transform: 'translate(-20px, -60px) rotate(-15deg)' }}>Babble</div>
                    <div style={{ animationDelay: '.85s', transform: 'translate(0px, -30px) rotate(2.5deg)' }}>Babble</div>
                    <div style={{ animationDelay: '1.7s', transform: 'translate(10px, 2px) rotate(-5deg)' }}>Babble</div>
                </div> : null}
            </div>
            <div id="controls" className={this.state.showControls ? 'show' : ''}>
                <p>Tap <img className="inline" src="arrowLeft.png" /> and <img className="inline" src="arrowRight.png" /> to change direction and move</p>
                <p>Tap <img className="inline" src="arrowUp.png" /> to bob up and down</p>
                <p>Hold <span style={{ color: 'white' }}>Space</span> to "babble"</p>
                <p>Tap <span style={{ color: 'white', whiteSpace: 'nowrap' }}>1-7</span> to change my expression</p>
            </div>
        </React.Fragment>
    }
}
