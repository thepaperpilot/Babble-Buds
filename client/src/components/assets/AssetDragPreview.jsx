import React, { PureComponent } from 'react'
import './assetpreview.css'

class AssetDragPreview extends PureComponent {
    constructor(props) {
        super(props)

        this.ref = React.createRef()

        this.state = {
            x: -100,
            y: -100
        }

        this.updatePos = this.updatePos.bind(this)
    }

    updatePos(e) {
        const target = this.props.monitor.getTargetIds()[0]
        if (target && this.props.monitor.canDropOnTarget(target))
            this.setState({ x: -100, y: -100 })
        else this.setState({
            x: e.clientX || -100,
            y: e.clientY || -100
        })
    }

    componentDidMount() {
        this.ref.current.nextSibling.addEventListener('drag', this.updatePos)
    }

    componentWillUnmount() {
        this.ref.current.nextSibling.removeEventListener('drag', this.updatePos)
    }

    render() {
        const { thumbnail, name } = this.props
        const { x, y } = this.state

        return <div ref={this.ref} className="char drag-preview" style={{
            top: y,
            left: x
        }}>
            <img src={thumbnail} alt={name} />
            <div className="inner-line-item">{name}</div>
        </div>
    }
}

export default AssetDragPreview
