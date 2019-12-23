import React, { Component } from 'react'
import { connect } from 'react-redux'
import { DragDropContext } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'
import Welcome from './components/welcome/Welcome'
import Project from './components/project/Project'
import { info } from './redux/status'
import { close, load } from './redux/project/project'
import { save } from './redux/project/saver'
import { setAddress } from './redux/settings'

const electron = window.require('electron')
const dialog = electron.remote.dialog
const settingsManager = electron.remote.require('./main-process/settings')

class App extends Component {
    constructor(props) {
        super(props)

        this.stage = React.createRef()

        this.setProject = this.setProject.bind(this)
        this.closeProject = this.closeProject.bind(this)
        this.save = this.save.bind(this)

        if (settingsManager.settings.address)
            props.dispatch(setAddress(settingsManager.settings.address))

        if (settingsManager.settings.openProject)
            props.dispatch(load(settingsManager.settings.openProject))
    }

    componentDidMount() {
        // Print debug info
        this.props.dispatch(info(`Babble Buds version: ${electron.remote.app.getVersion()}`))
        this.props.dispatch(info(`Other Versions: ${JSON.stringify(window.process.versions, null, 2)}`))
        
        electron.ipcRenderer.on('set project', this.setProject)
        electron.ipcRenderer.on('close', this.closeProject)
        electron.ipcRenderer.on('save', this.save)
    }

    componentWillUnmount() {
        electron.ipcRenderer.removeListener('set project', this.setProject)
        electron.ipcRenderer.removeListener('close', this.closeProject)
        electron.ipcRenderer.removeListener('save', this.save)
    }

    shouldComponentUpdate(nextProps) {
        return this.props.project !== nextProps.project
    }

    setProject(event, project) {
        if (!this.checkChanges()) return

        this.props.dispatch(load(project))
    }

    closeProject() {
        if (!this.checkChanges()) return

        settingsManager.closeProject()
        settingsManager.save()

        this.props.dispatch(close())
    }

    checkChanges() {
        if (this.props.project === null) return true
            
        const { settings, characters, environments, assets, saver } = this.props

        let changes = saver.settings !== JSON.stringify(settings)
        changes = changes || saver.characters !== JSON.stringify(characters)
        changes = changes || saver.environments !== JSON.stringify(environments)
        changes = changes || saver.assets !== JSON.stringify(assets)

        if (changes) {
            let response = dialog.showMessageBox({
                type: 'question',
                buttons: ['Don\'t Save', 'Cancel', 'Save'],
                defaultId: 2,
                title: 'Save Project?',
                message: 'Do you want to save the changes to your project?',
                detail: 'If you don\'t save, your changes will be lost.',
                cancelId: 1
            })

            switch (response) {
            default:
                break
            case 1:
                return false
            case 2:
                this.save()
                break
            }
        }

        return true
    }

    save() {
        this.props.dispatch(save())
    }

    render() {
        return (
            <div className="App">
                {
                    this.props.project ?
                        <Project /> :
                        <Welcome />
                }
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        project: state.project.project,
        settings: state.project.settings,
        characters: state.project.characters,
        environments: state.project.environments,
        assets: state.project.assets,
        saver: state.project.saver
    }
}

export default connect(mapStateToProps)(DragDropContext(HTML5Backend)(App))
