import React, {Component} from 'react'
import { connect } from 'react-redux'
import { DropTarget } from 'react-dnd'
import InlineEdit from './../ui/InlineEdit'
import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu'

import { getNewAssetID } from './../../reducers/project/assets'

const fs = window.require('fs-extra')
const path = require('path')
const remote = window.require('electron').remote
const settingsManager = remote.require('./main-process/settings')
const { GIF } = window.require('gif-engine-js')

class Folder extends Component {
    static id = 0

    constructor(props) {
        super(props)

        this.inlineEdit = React.createRef()

        this.focus = this.focus.bind(this)
        this.loadAssets = this.loadAssets.bind(this)
        this.addAsset = this.addAsset.bind(this)
        this.addAnimatedAsset = this.addAnimatedAsset.bind(this)
        this.renameFolder = this.renameFolder.bind(this)
        this.deleteFolder = this.deleteFolder.bind(this)
    }

    focus() {
        if (this.inlineEdit.current)
            this.inlineEdit.current.getWrappedInstance().edit()
    }

    // My first real asynchronous function :)
    // Although it still blocks the rendering thread (except for when its updating the progress bar) since node only has a single thread :(
    // TODO spawn hidden window and use IPC to tell it to do this, and respond back when done
    async loadAssets(filepaths, animated) {
        const statusId = `asset-${Folder.id++}`
        this.props.dispatch({
            type: 'IN_PROGRESS',
            count: filepaths.length,
            content: 'Adding new assets...',
            id: statusId
        })

        const assets = {}
        let completedAssets = 0
        const assetsPath = path.join(this.props.project, this.props.assetsPath,
            settingsManager.settings.uuid)
        await fs.ensureDir(assetsPath)
        // This'll let each filepath start loading in parallel,
        // and the code will wait for all of them to finish before
        // moving on
        await Promise.all(filepaths.map(async filepath => {
            let file = await fs.readFile(filepath)
            const name = filepath.replace(/^.*[\\/]/, '')
                .replace(/.png/, '')
                .replace(/.gif/, '')
            const id = getNewAssetID()
            const asset = {
                type: animated ? 'animated' : 'sprite',
                tab: this.props.name,
                name,
                version: 0,
                panning: [],
                location: path.join(settingsManager.settings.uuid, `${id}.png`)
            }

            if (animated) {
                // Default values (overriden if importing a gif)
                let rows = 1
                let cols = 1
                let numFrames = 1
                let delay = 60

                if (filepath.substr(filepath.length - 4) === '.gif') {
                    // If gif, turn it into animated png spritesheet
                    let gif = await GIF(new Uint8Array(file).buffer)
                    numFrames = gif.frames.length
                    delay = gif.frames[0].graphicExtension.delay
                    
                    // Optimize rows and columns to make an approximately square sheet
                    // (idk if this is useful but figured it wouldn't hurt)
                    rows = Math.ceil(Math.sqrt(gif.frames.length))
                    cols = Math.ceil(gif.frames.length / rows)
                    const width = gif.descriptor.width
                    const height = gif.descriptor.height
                    
                    // Create canvas to put each frame onto
                    var canvas = document.createElement('canvas')
                    var ctx = canvas.getContext('2d')
                    
                    // Create thumbnail first
                    canvas.width = width
                    canvas.height = height
                    ctx.putImageData(...(await gif.toImageData(0)))
                    await fs.writeFile(path.join(assetsPath, `${id}.thumb.png`),
                        new Buffer(canvas.toDataURL()
                            .replace(/^data:image\/\w+;base64,/, ''), 'base64'))
                    
                    // Stitch frames together
                    canvas.width = width * cols
                    canvas.height = height * rows
                    await Promise.all(gif.frames.map(async (frame, i) => {
                        const [imageData, offsetLeft, offsetTop] =
                            await gif.toImageData(i)
                        ctx.putImageData(imageData,
                            (i % cols) * width + offsetLeft,
                            Math.floor(i / cols) * height + offsetTop)
                    }))
                    file = new Buffer(canvas.toDataURL()
                        .replace(/^data:image\/\w+;base64,/, ''), 'base64')
                } else {
                    await fs.writeFile(path.join(assetsPath, `${id}.thumb.png`), file)
                }

                Object.assign(asset, { rows, cols, numFrames, delay })
                asset.thumbnail = path.join(settingsManager.settings.uuid,
                    `${id}.thumb.png`)
            }
            
            await fs.writeFile(path.join(assetsPath, `${id}.png`), file)
            assets[`${settingsManager.settings.uuid}:${id}`] = asset
            const count = completedAssets++
            this.props.dispatch({
                type: 'IN_PROGRESS',
                count,
                id: statusId
            })
        }))

        this.props.dispatch({
            type: 'ADD_ASSETS',
            assets
        })
    }

    addAsset() {
        remote.dialog.showOpenDialog(remote.BrowserWindow.getFocusedWindow(), {
            title: 'Add Assets',
            filters: [
                {name: 'Image', extensions: ['png']}
            ],
            properties: [
                'openFile',
                'multiSelections'
            ]
        }, (filepaths) => {
            if (!filepaths) return
            this.loadAssets(filepaths, false)
        })
    }

    addAnimatedAsset() {
        remote.dialog.showOpenDialog(remote.BrowserWindow.getFocusedWindow(), {
            title: 'Add Animated Assets',
            filters: [
                {name: 'Animated Image', extensions: ['gif']},
                {name: 'Animated Spritesheet', extensions: ['png']}
            ],
            properties: [
                'openFile',
                'multiSelections'
            ]
        }, (filepaths) => {
            if (!filepaths) return
            this.loadAssets(filepaths, true)
        })
    }

    renameFolder(name) {
        Object.keys(this.props.assets).filter(id =>
            this.props.assets[id].tab === this.props.name).forEach(id => {
            const asset = this.props.assets[id]
            if (id.split(':')[0] === this.props.self) {
                this.props.dispatch({
                    type: 'MOVE_ASSET',
                    asset: id,
                    tab: name
                })
            } else {
                this.props.dispatch({
                    type: 'WARN',
                    content: `Unable to move asset "${asset.name}" because its owned by someone else. Please duplicate the asset and remove the original and try again.`
                })
            }
        })
    }

    deleteFolder() {
        // TODO can't delete other people's assets IF we're connected to other people
        this.props.dispatch({
            type: 'DELETE_TAB',
            tab: this.props.name
        })
    }

    render() {
        return <div>
            <ContextMenuTrigger
                id={`contextmenu-tab-${this.props.name}`}
                holdToDisplay={-1}>
                {this.props.connectDropTarget(<div style={{
                    backgroundColor: this.props.isOver ? 'rgba(0, 255, 0, .2)' :
                        this.props.canDrop ? 'rgba(0, 255, 0, .05)' : ''
                }}>
                    <InlineEdit
                        ref={this.inlineEdit}
                        target={this.props.name}
                        selectable={false}
                        className="header"
                        onChange={this.renameFolder} />
                </div>)}
            </ContextMenuTrigger>
            <ContextMenu id={`contextmenu-tab-${this.props.name}`}>
                <MenuItem onClick={this.focus}>Rename</MenuItem>
                <MenuItem onClick={this.deleteFolder}>Delete</MenuItem>
                <MenuItem onClick={this.addAsset}>Add Asset</MenuItem>
                <MenuItem onClick={this.addAnimatedAsset}>Add Animated Asset</MenuItem>
            </ContextMenu>
        </div>
    }
}

const assetTarget = {
    drop(props, monitor) {
        props.dispatch({
            type: 'MOVE_ASSET',
            asset: monitor.getItem().asset,
            tab: props.name
        })
    }
}

function collect(connect, monitor) {
    return {
        connectDropTarget: connect.dropTarget(),
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop()
    }
}

function mapStateToProps(state) {
    return {
        assets: state.project.assets,
        project: state.project.project,
        assetsPath: state.project.settings.assetsPath,
        self: state.self
    }
}

export default DropTarget('asset', assetTarget, collect)(connect(mapStateToProps)(Folder))
