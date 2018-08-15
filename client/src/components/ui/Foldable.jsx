import React, {Component} from 'react'
import AnimateHeight from 'react-animate-height'
import './foldable.css'

class Foldable extends Component {
    constructor(props) {
        super(props)

        this.state = {
            folded: !!props.defaultFolded
        }

        this.toggleFolded = this.toggleFolded.bind(this)
    }

    toggleFolded() {
        this.setState({
            folded: !this.state.folded
        })
    }

    render() {
        return (
            <div className={`foldable${this.state.folded ? '' : ' open'}`}>
                <h4 style={{cursor: 'pointer'}} onClick={this.toggleFolded}>
                    {this.props.title}
                    {this.props.subtitle && <div className="subtitle">{this.props.subtitle}</div>}
                </h4>

                <AnimateHeight duration={500} height={this.state.folded ? '0' : 'auto'}>
                    {this.props.children}
                </AnimateHeight>
            </div>
        )
    }
}

export default Foldable
