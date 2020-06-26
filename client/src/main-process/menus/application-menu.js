const {Menu, shell} = require('electron')
const settings = require('../settings')
const util = require('../util')

// Create menu
const template = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Open Project',
                accelerator: 'CommandOrControl+O',
                click () {
                    util.selectProject()
                }
            },
            {
                label: 'Close Project',
                accelerator: 'CommandOrControl+W',
                click (item, focusedWindow) {
                    focusedWindow.webContents.send('close')
                }
            },
            {
                label: 'Save Project',
                accelerator: 'CommandOrControl+S',
                click (item, focusedWindow) {
                    focusedWindow.webContents.send('save')
                }
            },
            {
                type: 'separator'
            },
            {
                role: 'quit'
            }
        ],
    },
    {
    // cut, copy, and paste don't work for some reason
    // I got around this by just checking for the keys
    // inside of the editor's keyDown function
    // Untested on macOS
        label: 'Edit',
        submenu: [
            {
                label: 'Cut',
                accelerator: 'CommandOrControl+X',
                click (item, focusedWindow) {
                    focusedWindow.webContents.send('cut')
                }
            },
            {
                label: 'Copy',
                accelerator: 'CommandOrControl+C',
                click (item, focusedWindow) {
                    focusedWindow.webContents.send('copy')
                }
            },
            {
                label: 'Paste',
                accelerator: 'CommandOrControl+V',
                click (item, focusedWindow) {
                    focusedWindow.webContents.send('paste')
                }
            },
            {
                label: 'Delete',
                accelerator: 'Delete',
                click (item, focusedWindow) {
                    focusedWindow.webContents.send('delete')
                }
            },
            {
                type: 'separator'
            },
            {
                label: 'Undo',
                accelerator: 'CommandOrControl+Z',
                click (item, focusedWindow) {
                    focusedWindow.webContents.send('undo')
                }
            },
            {
                label: 'Redo',
                accelerator: 'CommandOrControl+Y',
                click (item, focusedWindow) {
                    focusedWindow.webContents.send('redo')
                }
            }
        ]
    },
    {
        label: 'View',
        submenu: [
            {
                label: 'Layouts',
                submenu: [
                    {
                        label: 'Default',
                        click (item, focusedWindow) {
                            focusedWindow.webContents.send('load layout', 'default')
                        }
                    }/*,
                    {
                        type: 'separator'
                    },
                    {
                        label: 'Save Layout...',
                        click () {
                            
                        }
                    },
                    {
                        label: 'Delete Layout...',
                        click () {
                            
                        }
                    },
                    {
                        label: 'Restore Factory Settings',
                        click () {
                            
                        }
                    }*/
                ]
            },
            {
                type: 'separator'
            },
            {
                label: 'Stage',
                click (item, focusedWindow) {
                    focusedWindow.webContents.send('toggle panel', 'stage')
                }
            },
            {
                label: 'Puppet Controller',
                click (item, focusedWindow) {
                    focusedWindow.webContents.send('toggle panel', 'puppet-controller')
                }
            },
            {
                label: 'Emote Controller',
                click (item, focusedWindow) {
                    focusedWindow.webContents.send('toggle panel', 'emote-controller')
                }
            },
            {
                label: 'Environment Controller',
                click (item, focusedWindow) {
                    focusedWindow.webContents.send('toggle panel', 'environment-controller')
                }
            },
            {
                type: 'separator'
            },
            {
                label: 'Puppets',
                click (item, focusedWindow) {
                    focusedWindow.webContents.send('toggle panel', 'puppets')
                }
            },
            {
                label: 'Assets',
                click (item, focusedWindow) {
                    focusedWindow.webContents.send('toggle panel', 'assets')
                }
            },
            {
                label: 'Environments',
                click (item, focusedWindow) {
                    focusedWindow.webContents.send('toggle panel', 'environments')
                }
            },
            {
                label: 'Layers',
                click (item, focusedWindow) {
                    focusedWindow.webContents.send('toggle panel', 'layers')
                }
            },
            {
                label: 'Editor',
                click (item, focusedWindow) {
                    focusedWindow.webContents.send('toggle panel', 'editor')
                }
            },
            {
                type: 'separator'
            },
            {
                label: 'Inspector',
                click (item, focusedWindow) {
                    focusedWindow.webContents.send('toggle panel', 'inspector')
                }
            },
            {
                label: 'Project Settings',
                click (item, focusedWindow) {
                    focusedWindow.webContents.send('toggle panel', 'project-settings')
                }
            },
            {
                label: 'Console',
                click (item, focusedWindow) {
                    focusedWindow.webContents.send('toggle panel', 'console')
                }
            },
            {
                label: 'Multiplayer',
                click (item, focusedWindow) {
                    focusedWindow.webContents.send('toggle panel', 'multiplayer')
                }
            },
            {
                type: 'separator'
            },
            {
                label: 'Toggle Popout',
                accelerator: 'CommandOrControl+P',
                click (item, focusedWindow) {
                    focusedWindow.webContents.send('togglePopout')
                }
            },
            {
                label: 'Toggle Dev Tools',
                click (item, focusedWindow) {
                    focusedWindow.toggleDevTools()
                }
            }
        ]
    },
    {
        label: 'Project',
        submenu: [
            {
                label: 'Open Project Folder',
                accelerator: 'F10',
                click () {
                    shell.showItemInFolder(settings.settings.openProject)
                }
            },
            {
                label: 'Autocrop Assets',
                click (item, focusedWindow) {
                    focusedWindow.webContents.send('autocrop')
                }
            },
            {
                label: 'Reload Assets',
                click (item, focusedWindow) {
                    // Note: This won't update assets on connected clients
                    // How can I ensure users are aware of that?
                    focusedWindow.webContents.send('reload')
                }
            },
            {
                label: 'Prune Downloaded Assets',
                click (item, focusedWindow) {
                    focusedWindow.webContents.send('prune')
                }
            }
        ]
    },
    {
        label: 'Help',
        submenu: [
            {
                label: 'Instructions',
                accelerator: 'CommandOrControl+H',
                click (item, focusedWindow) {
                    focusedWindow.webContents.send('toggleInstructions')
                }
            },
            {
                type: 'separator'
            },
            {
                label: 'Github Page',
                click () {
                    shell.openExternal('https://github.com/thepaperpilot/Babble-Buds')
                }
            },
            {
                label: 'URealms Forums Page',
                click () {
                    shell.openExternal('https://forums.urealms.com/discussion/272/alpha-babble-buds-a-virtual-puppet-show-software/p1')
                }
            },
            {
                label: 'Changelog',
                click () {
                    shell.openExternal('https://github.com/thepaperpilot/Babble-Buds/releases')
                }
            },
            {
                type: 'separator'
            },
            {
                label: 'About Babble Buds',
                click (item, focusedWindow) {
                    focusedWindow.webContents.send('toggleAbout')
                }
            }
        ]
    }
]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)

exports.updateMenu = function(enabled) {
    menu.items[0].submenu.items[1].enabled = enabled
    menu.items[0].submenu.items[2].enabled = enabled
    for (let i = 2; i <= 3; i++) {
        for (let j = 0; j < menu.items[i].submenu.items.length; j++) {
            menu.items[i].submenu.items[j].enabled = enabled
            if (i == 2 && j == 16)
                break
        }
    }
}

exports.updateMenu(false)
