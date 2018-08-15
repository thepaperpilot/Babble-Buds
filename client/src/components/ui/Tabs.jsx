import React, {Component} from 'react'
import './tabs.css'

class Panels extends Component {
    constructor(props) {
        super(props)
        this.state = {
            tab: 0
        }

        this.setTab = this.setTab.bind(this)
    }

    setTab(tab) {
        return () => this.setState({ tab })
    }

    render() {
        return (
            <div className="tabs">
                {Object.keys(this.props.tabs).map((t, i) => (
                    <div
                        key={t}
                        className={this.state.tab == i ? 'tab-label open' : 'tab-label'}
                        onClick={this.setTab(i)}>
                        {t}
                    </div>
                ))}
                <div className="tabs-content">
                    {Object.keys(this.props.tabs).map((t, i) => (
                        <div
                            id={`tab-${i}-content`}
                            // eslint-disable-next-line
                            className={this.state.tab == i ? 'open-tab-content' : undefined}
                            key={t}>
                            {this.props.tabs[t]}
                        </div>
                    ))}
                </div>
            </div>
        )
    }
}

export default Panels
