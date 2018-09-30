import React, {Component} from 'react'
import { connect } from 'react-redux'
import Scrollbar from 'react-custom-scroll'
import Checkbox from '../inspector/fields/Checkbox'
import Number from '../inspector/fields/Number'
import Modal from '../ui/Modal'
import Foldable from '../ui/Foldable'
import './importer.css'

import { loadCharacters, loadAssets } from './../../reducers/project/loader'

const fs = window.require('fs-extra')
const path = require('path')
const remote = window.require('electron').remote

class AssetImporter extends Component {
    constructor(props) {
        super(props)

        this.state = {
            open: false,
            characters: [],
            selected: []
        }

        this.import = this.import.bind(this)
        this.cancel = this.cancel.bind(this)
        this.toggleAll = this.toggleAll.bind(this)
        this.togglePuppet = this.togglePuppet.bind(this)
        this.importPuppets = this.importPuppets.bind(this)
    }

    async import() {
        const assets = {}
        const topLevel = ['body', 'head', 'hat', 'props']
        const assetsPath = path.join(this.props.project, this.props.assetsPath)
        const thumbnailsPath = path.join(this.props.project, 
            this.props.charactersPath, '..', 'thumbnails')
        const checkLayer = async layer => {
            await Promise.all(layer.map(async assetInfo => {
                if (assetInfo.id in this.props.assets) return
                if (assetInfo.id in assets) return
                const asset = this.state.assets[assetInfo.id]
                const location = path.join(this.props.self,
                    `${assetInfo.id.split(':')[1]}.png`)
                assets[assetInfo.id] = asset

                // Copy assets to this project
                await fs.copy(
                    path.join(this.state.assetsPath, asset.location),
                    path.join(assetsPath, location))
                asset.location = location
                if (asset.thumbnail)
                    await fs.copy(
                        path.join(this.state.assetsPath, asset.thumbnail),
                        path.join(assetsPath, asset.thumbnail))
            }))
        }
        await Promise.all(this.state.selected.map(async id => {
            // Copy thumbnails over to this project
            const thumbnail = this.state.characterThumbnails[id].slice(8)
            if (await fs.exists(thumbnail))
                await fs.copy(thumbnail, 
                    `${path.join(thumbnailsPath, `new-${id}.png`)}`)

            const thumbFolder = thumbnail.split('.').slice(0, -1).join('.')
            if (await fs.exists(thumbFolder))
                await fs.copy(thumbFolder,
                    `${path.join(thumbnailsPath, `new-${id}`)}`)

            // Import any assets this character has that we don't have
            const puppet = this.state.characters[id]
            await Promise.all(topLevel.map(async layer => 
                checkLayer(puppet[layer])
            ))
            await Promise.all(Object.values(puppet.emotes).map(async emote => {
                await checkLayer(emote.eyes)
                await checkLayer(emote.mouth)
            }))
        }))

        const puppets = this.state.selected.reduce((acc, curr) => {
            acc[curr] = this.state.characters[curr]
            return acc
        }, {})

        this.setState({
            open: false
        })

        this.props.dispatch({
            type: 'ADD_PUPPETS',
            puppets,
            assets
        })
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

    // TODO do in hidden browserWindow so you don't block UI thread
    async importPuppets() {
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
        }, async filepaths => {
            if (!filepaths) return
            const project = await fs.readJson(filepaths[0])
            
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
            const assets = loadAssets(project, assetsPath, characters)

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
            const reducer = (acc, curr) => {
                if (curr.emote) {
                    return acc.concat({
                        emote: curr.emote,
                        name: curr.name
                    })
                } else if (curr.children) {
                    return curr.children.reduce(reducer, acc)
                } else return acc
            }
            const emotes = puppet.layers.children.reduce(reducer, [])
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

export default connect(mapStateToProps)(AssetImporter)
