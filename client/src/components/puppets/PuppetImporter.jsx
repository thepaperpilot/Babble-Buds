import React, { Component } from 'react'
import { connect } from 'react-redux'
import Scrollbar from 'react-custom-scroll'
import Checkbox from '../inspector/fields/Checkbox'
import Number from '../inspector/fields/Number'
import Modal from '../ui/Modal'
import Foldable from '../ui/Foldable'
import { getEmotes } from '../controller/Emotes'
import { loadCharacters, loadAssets } from '../../redux/project/loader'
import { inProgress } from '../../redux/status'

import './importer.css'

const fs = window.require('fs-extra')
const path = require('path')
const {remote, ipcRenderer} = window.require('electron')

class PuppetImporter extends Component {
    static id = 0

    constructor(props) {
        super(props)

        this.state = {
            open: false,
            characters: [],
            assets: {},
            selected: []
        }

        this.import = this.import.bind(this)
        this.cancel = this.cancel.bind(this)
        this.toggleAll = this.toggleAll.bind(this)
        this.togglePuppet = this.togglePuppet.bind(this)
        this.importPuppets = this.importPuppets.bind(this)
    }

    import() {
        const assets = {}
        const assetsPath = path.join(this.props.project, this.props.assetsPath)
        const thumbnailsPath = path.join(this.props.project, 
            this.props.charactersPath, '..', 'thumbnails')
        const puppetsStatusId = `import-puppet-${PuppetImporter.id++}`
        const assetsStatusId = `${puppetsStatusId}-assets`

        const checkLayer = (puppet, layer) => {
            layer.children.forEach(layer => {
                // Continue searching through the layers
                if (layer.children)
                    checkLayer(puppet, layer)

                // Ensure this is a new asset
                if (!('id' in layer)) return
                if (layer.id in this.props.assets) return
                if (layer.id in assets) return

                // Add asset to the appropiate lists
                assets[layer.id] = this.state.assets[layer.id]
                puppet.assets.push(layer.id)
            })
        }

        const puppets = this.state.selected.reduce((acc, curr) => {
            const thumbnail = this.state.characterThumbnails[curr].slice(8)
            const thumbFolder = thumbnail.split('.').slice(0, -1).join('.')

            acc[curr] = this.state.characters[curr]
            // These are temporary variables for use in the background
            // process that will be removed before adding them to the
            // puppet list
            acc[curr].thumbnail = thumbnail
            acc[curr].thumbFolder = thumbFolder
            acc[curr].assets = []

            // Import any assets this character has that we don't have
            checkLayer(acc[curr], this.state.characters[curr].layers)

            return acc
        }, {})

        this.setState({
            open: false
        })

        this.props.dispatch(inProgress(puppetsStatusId, Object.keys(puppets).length, 'Importing puppets...'))

        this.props.dispatch(inProgress(assetsStatusId, Object.keys(assets).length, 'Importing assets...'))

        ipcRenderer.send('background', 'add puppets',
            puppets,
            assets,
            this.state.assetsPath,
            assetsPath,
            thumbnailsPath,
            puppetsStatusId,
            assetsStatusId
        )
    }

    cancel() {
        this.setState({
            open: false
        })
    }

    toggleAll(allSelected) {
        return () => {
            this.setState({
                selected: allSelected ? [] : Object.keys(this.state.characters)
            })
        }
    }

    togglePuppet(id) {
        return () => {
            const selected = this.state.selected.slice()
            if (this.state.selected.includes(id)) {
                selected.splice(selected.indexOf(id), 1)
            } else {
                selected.push(id)
            }
            this.setState({ selected })
        }
    }

    importPuppets() {
        remote.dialog.showOpenDialog(remote.BrowserWindow.getFocusedWindow(), {
            title: 'Select Project',
            defaultPath: path.join(remote.app.getPath('home'), 'projects'),
            filters: [
                {name: 'Babble Buds Project File', extensions: ['babble']},
                {name: 'All Files', extensions: ['*']}
            ],
            properties: [
                'openFile'
            ] 
        }, filepaths => {
            if (!filepaths) return
            const project = fs.readJsonSync(filepaths[0])
            
            const puppetsPath = path.join(filepaths[0],
                project.charactersPath || '../characters')
            const { characters: rawCharacters,
                characterThumbnails: rawThumbnails } =
                loadCharacters(project, puppetsPath)
            const characters = {}
            const characterThumbnails = {}
            Object.values(rawCharacters).forEach((character, i) => {
                const id = this.props.numCharacters + i + 1
                characterThumbnails[id] = rawThumbnails[character.id]
                character.id = id
                characters[id] = character
            })

            const assetsPath = path.join(filepaths[0],
                project.assetsPath || '../assets')
            const {assets} = loadAssets(project, assetsPath, characters)

            this.setState({
                project: filepaths[0],
                open: true,
                selected: [],
                characters,
                characterThumbnails,
                puppetsPath,
                assets,
                assetsPath
            })
        })
    }

    render() {
        let allSelected = Object.keys(this.state.characters).sort().join(',') ===
            this.state.selected.sort().join(',')

        const puppets = Object.keys(this.state.characters).map(id => {
            const puppet = this.state.characters[id]
            const selected = this.state.selected.includes(id)
            const thumbnails = this.state.characterThumbnails[id].split('.').slice(0, -1).join('.')
            const emotes = getEmotes(this.state.assets, puppet.layers)
            return <Foldable
                key={id}
                defaultFolded={true}
                title={<div className="puppet-importer-title">
                    <div className="puppet-importer-img char">
                        <img
                            alt={puppet.name}
                            src={this.state.characterThumbnails[id]}
                            style={{width: '60px', height: '60px'}} />
                    </div>
                    <div className="puppet-importer-label">
                        <p>{puppet.name}</p>
                        <p>Creator: {puppet.creator === this.props.self ? this.props.nick : puppet.creator}</p>
                        <p>OC: {puppet.oc === this.props.self ? this.props.nick : puppet.oc}</p>
                    </div>
                    <Checkbox
                        inline={true}
                        value={selected}
                        onChange={this.togglePuppet(id)}/>
                </div>}>
                <div className="action">
                    <Checkbox
                        title="Bobble head while talking"
                        value={puppet.deadbonesStyle}
                        disabled={true} />
                    <Number
                        title="Eyes Duration (while babbling)"
                        value={puppet.eyeBabbleDuration || 2000}
                        disabled={true} />
                    <Number
                        title="Mouth Duration (while babbling)"
                        value={puppet.mouthBabbleDuration || 270}
                        disabled={true} />
                </div>
                <div className="list">
                    {emotes.map(emote => {
                        return (
                            <div
                                className="list-item"
                                style={{height: '120px', width: '120px'}}
                                key={emote.name} >
                                <div className="char" key={emote.name}>
                                    <img alt={emote.name} src={`${thumbnails}/${emote.emote}.png`}/>
                                    <div className="desc">{emote.name}</div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </Foldable>
        })

        return <div>
            <button onClick={this.importPuppets}>Import</button>
            <Modal
                title={`Import Puppets - ${path.basename(this.state.project)}`}
                open={this.state.open}
                onClose={this.cancel}
                style={{ height: '80%' }}
                footer={[
                    <Checkbox
                        inline={true}
                        title="Toggle All"
                        key="1"
                        value={allSelected}
                        onChange={this.toggleAll(allSelected)}/>,
                    <div className="flex-grow" key="2"/>,
                    <button onClick={this.import} key="3">Import</button>]}>
                <Scrollbar allowOuterScroll={true} heightRelativeToParent="calc(100% - 48px)">
                    <div className="puppet-importer">
                        {puppets}
                    </div>
                </Scrollbar>
            </Modal>
        </div>
    }
}

function mapStateToProps(state) {
    return {
        assets: state.project.assets,
        project: state.project.project,
        assetsPath: state.project.settings.assetsPath,
        charactersPath: state.project.settings.charactersPath,
        self: state.self,
        nick: state.project.settings.nickname,
        numCharacters: state.project.numCharacters
    }
}

export default connect(mapStateToProps)(PuppetImporter)
