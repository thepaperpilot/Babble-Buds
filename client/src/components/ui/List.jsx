import React, {Component} from 'react'
import Scrollbar from 'react-custom-scroll'
import './list.css'

class List extends Component {
    render() {
        // Add some extra elements with 0 height to make sure all the elements
        // are left-aligned properly
        // We'll make one for each real element, which will correctly render
        // any amount of elements more than a single line
        // We'll create a minimum amount of elements, and it'll correctly
        // render a single line with that many or fewer elements
        // We'll choose a high enough minimum so that a single line with more
        // than that many elements is very uncommon and the slightly enlarged
        // gaps won't be super noticeable, but low enough to not cause
        // unnecessary lag (I don't know how performant this solution is)
        let numPad = Object.keys(this.props.children).length
        if (numPad < 7) numPad = 7

        const list = <div className="list">
            {Object.keys(this.props.children).map(child => (
                <div
                    className="list-item"
                    key={child}
                    style={{width: this.props.width, height: this.props.height}}>
                    {this.props.children[child]}
                </div>
            ))}
            {new Array(numPad).fill(0).map((child, i) => (
                <div className="list-pad" key={`${i}-pad`} style={{width: this.props.width}}></div>
            ))}
        </div>
        return this.props.scrollbar === false ? list :
            <Scrollbar allowOuterScroll={true} heightRelativeToParent="100%">
                {list}
            </Scrollbar>
    }
}

export default List
