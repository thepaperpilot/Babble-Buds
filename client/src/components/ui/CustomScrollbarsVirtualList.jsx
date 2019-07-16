import React, {Component} from 'react'
import Scrollbar from 'react-custom-scroll'
import './../ui/scrollbar.css'

class CustomScrollbarsVirtualList extends Component {
    constructor(props) {
        super(props)

        this.state = {
            scrollTo: undefined
        }

        this.onScroll = this.onScroll.bind(this)
        this.scrollTo = this.scrollTo.bind(this)
    }

    onScroll(event) {
        this.setState({
            scrollTo: undefined
        })
        this.props.onScroll(event)
    }

    scrollTo(scrollTo) {
        this.setState({ scrollTo })
    }

    render() {
        return <Scrollbar
            onScroll={this.onScroll}
            scrollTo={this.state.scrollTo}
            allowOuterScroll={true}
            heightRelativeToParent="100%" >
            <div style={{ position: 'relative' }} >
                {this.props.children}
            </div>
        </Scrollbar>
    }
}

export default CustomScrollbarsVirtualList
