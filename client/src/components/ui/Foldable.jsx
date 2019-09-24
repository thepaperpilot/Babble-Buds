import React, {Component} from 'react'
import AnimateHeight from 'react-animate-height'
import classNames from 'classnames'
import './foldable.css'

function isNewState(a, b) {
    if (!(a instanceof Array && b instanceof Array))
        return a !== b
    if (a.length !== b.length)
        return true
    for (let i = 0; i < a.length; i++)
        if (a[i] !== b[i]) {
            return true
        }
    return false
}

class Foldable extends Component {
    constructor(props) {
        super(props)

        this.state = {
            folded: !!props.defaultFolded,
            updating: false
        }

        this.toggleFolded = this.toggleFolded.bind(this)
    }

    toggleFolded(e) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'LABEL')
            this.setState({
                folded: !this.state.folded
            })
    }

    componentWillReceiveProps(newProps) {
        if (isNewState(newProps.state, this.props.state))
            this.setState({
                folded: !!newProps.defaultFolded,
                updating: true
            }, () => {
                this.setState({
                    updating: false
                })
            })
    }

    componentDidUpdate() {
        if (this.state.updating)
            this.setState({
                updating: false
            })
    }

    render() {
        return this.state.updating ? null :
            <div className={classNames({
                foldable: true,
                open: this.state.folded,
                ...this.props.classNames
            })}>
                <h4 style={{cursor: 'pointer'}} onClick={this.toggleFolded}>
                    {this.props.title}
                    {this.props.subtitle && <div className="subtitle">{this.props.subtitle}</div>}
                </h4>

                <AnimateHeight duration={500} height={this.state.folded ? 0 : 'auto'}>
                    {this.props.children}
                </AnimateHeight>
            </div>
    }
}

export default Foldable
