import React, { Component } from 'react'
import Scrollbar from 'react-custom-scroll'
import Checkbox from '../inspector/fields/Checkbox'
import Modal from '../ui/Modal'

import './importer.css'

const path = require('path')
const remote = window.require('electron').remote

class Importer extends Component {
    constructor(props) {
        super(props)

        this.state = {
            open: false,
            items: [],
            itemsByFile: {},
            selected: [],
            allSelected: false,
            singleItem: false
        }

        this.import = this.import.bind(this)
        this.cancel = this.cancel.bind(this)
        this.toggleAll = this.toggleAll.bind(this)
        this.toggleItem = this.toggleItem.bind(this)
        this.openFile = this.openFile.bind(this)
    }

    import() {
        const { items, itemsByFile, selected, singleItem } = this.state

        Object.keys(itemsByFile).forEach(filepath => {
            if (singleItem && itemsByFile[filepath].length > 0) {
                const id = itemsByFile[filepath][0]
                this.props.import(filepath, { [id]: items[id] })
                return
            }

            const selectedItems = selected.filter(id => itemsByFile[filepath].includes(id))
                .reduce((acc, curr) => (acc[curr] = items[curr]) && acc, {})

            this.props.import(filepath, selectedItems)
        })

        this.setState({
            open: false
        })
    }

    cancel() {
        this.setState({
            open: false
        })
    }

    toggleAll() {
        this.setState({
            selected: this.state.allSelected ? [] : Object.keys(this.state.items),
            allSelected: !this.state.allSelected
        })
    }

    toggleItem(...ids) {
        return () => {
            const selected = this.state.selected.slice()
            ids.forEach(id => {
                if (this.state.selected.includes(id)) {
                    selected.splice(selected.indexOf(id), 1)
                } else {
                    selected.push(id)
                }
            })
            const allSelected = Object.keys(this.state.items).sort().join(',') === selected.sort().join(',')
            this.setState({ selected, allSelected })
        }
    }

    async openFile() {
        const filters = [
            {name: 'Babble Buds Project File', extensions: ['babble']},
            ...(this.props.filters || []),
            {name: 'All Files', extensions: ['*']}
        ]
        if (this.props.filters)
            filters.unshift({
                name: 'All formats',
                extensions: [ 'babble', ...this.props.filters.reduce((acc, curr) => [...acc, ...curr.extensions], []) ]
            })

        const result = await remote.dialog.showOpenDialog(remote.BrowserWindow.getFocusedWindow(), {
            title: this.props.title,
            defaultPath: path.join(remote.app.getPath('home'), 'projects'),
            filters,
            properties: [
                'openFile',
                'multiSelections'
            ]
        })

        if (result.filePaths.length) {
            const itemsByFile = {}

            if (this.props.onOpen) this.props.onOpen()

            let items = {}
            result.filePaths.forEach(filepath => {
                filepath = filepath.replace(/\\/g, '/')

                const newItems = this.props.readFile(filepath)
                if (newItems != null) {
                    itemsByFile[filepath] = Object.keys(newItems)
                    items = {...items, ...newItems}
                }
            })

            const numItems = Object.keys(items).length
            if (numItems > 0)
                this.setState({
                    open: true,
                    selected: [],
                    allSelected: false,
                    singleItem: numItems === 1,
                    items,
                    itemsByFile
                })
        }
    }

    render() {
        const { title, importClassName, createElement } = this.props
        const { open, items, selected, allSelected, singleItem } = this.state
        
        const footer = [
            ...(this.props.footers || []),
            <div className="flex-grow" key="2"/>,
            <button onClick={this.import} key="3" disabled={!singleItem && selected.length === 0}>
                Import{singleItem ? '' : ` ${selected.length} item${selected.length === 1 ? '' : 's'}`}
            </button>
        ]
        if (!singleItem)
            footer.unshift(<Checkbox
                inline={true}
                title="Toggle All"
                key="1"
                value={allSelected}
                onChange={this.toggleAll}/>)

        const elements = this.props.createElements != null ?
            this.props.createElements({ items, selected, toggleItem: this.toggleItem, singleItem }) : 
            <Scrollbar allowOuterScroll={true} heightRelativeToParent="calc(100% - 48px)">
                <div className={importClassName}>
                    {Object.keys(items).map(id => createElement({
                        id,
                        singleItem,
                        item: items[id],
                        selected: selected.includes(id),
                        toggleItem: this.toggleItem
                    }))}
                </div>
            </Scrollbar>

        return <div>
            <button onClick={this.openFile}>Import</button>
            <Modal
                title={title}
                open={open}
                onClose={this.cancel}
                style={{ height: '80%' }}
                footer={footer}>
                {elements}
            </Modal>
        </div>
    }
}

export default Importer
