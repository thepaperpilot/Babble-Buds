import React, {Component} from 'react'
import { connect } from 'react-redux'
import { DragDropContext } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'
import Welcome from './components/welcome/Welcome'
import Project from './components/project/Project'

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

        if (settingsManager.settings.openProject)
            props.dispatch({ type: 'LOAD_PROJECT', project: settingsManager.settings.openProject })
    }

    componentDidMount() {
        // Print debug info
        this.props.dispatch({
            type: 'INFO',
            content: `Babble Buds version: ${electron.remote.app.getVersion()}`
        })
        this.props.dispatch({
            type: 'INFO',
            content: `Other Versions: ${JSON.stringify(window.process.versions, null, 2)}`
        })
        
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

        this.props.dispatch({
            type: 'LOAD_PROJECT',
            project
        })
    }

    closeProject() {
        if (!this.checkChanges()) return

        settingsManager.closeProject()
        settingsManager.save()

        this.props.dispatch({ type: 'CLOSE_PROJECT' })
    }

    checkChanges() {
        if (this.props.project === null) return true
            
        const {oldSettings, settings, oldCharacters, characters} = this.props

        let changes = oldSettings !== JSON.stringify(settings)
        changes = changes || oldCharacters !== JSON.stringify(characters)

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
        // TODO create a "thumbnail stage" instead of using a ref
        if (!this.stage.current) return
        this.props.dispatch({
            type: 'SAVE',
            thumbnail: this.stage.current.stage.getThumbnail()
        })
    }

    render() {
        console.log('current project', this.props.project)
        return (
            <div className="App">
                {
                    this.props.project ?
                        <Project stage={this.stage} /> :
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
        oldSettings: state.project.oldSettings,
        characters: state.project.characters,
        oldCharacters: state.project.oldCharacters
    }
}

export default connect(mapStateToProps)(DragDropContext(HTML5Backend)(App))
