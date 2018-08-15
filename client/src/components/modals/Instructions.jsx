import React, {Component} from 'react'
import Tabs from './../ui/Tabs'

class Instructions extends Component {
    render() {
        return (
            <div id="instructions" style={{display: 'none'}}>
                <div style={{width: '100%', height: '500px'}}>
                    <Tabs tabs={{
                        'NYI': <div>Not Yet Implemented</div>
                    }}/>
                </div>
            </div>
        )
    }
}

/*
function scrollHorizontally(e) {
    if (e.target !== document.getElementById('tabs') && e.target.className !== 'tab-label') return
    e = window.event || e
    var delta = Math.max(-1, Math.min(1, e.wheelDelta))
    document.getElementById('tabs').scrollLeft -= (delta*40)
    e.preventDefault()
}
document.getElementById('tabs').addEventListener('mousewheel', scrollHorizontally)
*/

export default Instructions
