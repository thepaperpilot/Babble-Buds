import React, { Component } from 'react'
import { connect } from 'react-redux'
import AssetUpdater from './components/project/AssetUpdater'
import Stage from './components/stage/Stage'
import PopoutKeyboardListener from './components/project/PopoutKeyboardListener'

const electron = window.require('electron')

// Make the window draggable but still resizable when near the edges of the window
const Dragger = () => <div style={{
    webkitAppRegion: "drag",
    position: "fixed",
    top: "4px",
    left: "4px",
    right: "4px",
    bottom: "4px"
}}></div>
const Resizer = () => <div style={{
    webkitAppRegion: "no-drag",
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
}}></div>

class App extends Component {
    constructor(props) {
        super(props)

        this.assetUpdater = React.createRef()
        this.stage = React.createRef()

        this.setReduxState = this.setReduxState.bind(this)
    }

    componentDidMount() {
        electron.ipcRenderer.on('setState', this.setReduxState)
    }

    componentWillUnmount() {
        electron.ipcRenderer.off('setState', this.setReduxState)
    }

    componentDidUpdate(prevProps) {
        if (!prevProps.project && this.props.project)
            // rerender now that our AssetUpdater prop will be working
            this.setState({})
    }

    setReduxState(e, state) {
        this.props.dispatch({ type: "SET_STATE", state })
    }

    render() {
        return <div className="App" style={{ position: "fixed", width: "100%", height: "100%" }}>
            {this.props.project ? <AssetUpdater ref={this.assetUpdater} /> : null}
            <Resizer />
            <Dragger />
            {this.assetUpdater.current ? <Stage ref={this.stage} id={0} assetUpdater={this.assetUpdater.current} /> : null}
            <PopoutKeyboardListener />
        </div>
    }
}

function mapStateToProps(state) {
    return {
        project: state.project && state.project.project
    }
}

export default connect(mapStateToProps)(App)
