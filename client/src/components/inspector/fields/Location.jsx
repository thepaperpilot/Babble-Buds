import React, {Component} from 'react'

const electron = window.require('electron')
const remote = electron.remote
const util = remote.require('./main-process/util')

function browse(event) {
    event.preventDefault()
    util.selectDirectory()
}

class Location extends Component {
    constructor(props) {
        super(props)

        this.setLocation = this.setLocation.bind(this)
    }

    componentDidMount() {
        electron.ipcRenderer.on('set directory', this.setLocation)
    }

    componentWillUnmount() {
        electron.ipcRenderer.off('set directory', this.setLocation)
    }

    setLocation(event, location) {
        this.props.onChange(location)
    }

    render() {
        const {title, value, onChange, ...props} = this.props
        return <div className="field text">
            <p className="field-title">{title}</p>
            <input type="text" value={value} onChange={e => onChange(e.target.value)} {...props} />
            <button type='button' onClick={browse}>Browse</button>
        </div>
    }
}

export default Location
