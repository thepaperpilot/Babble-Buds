const {BrowserWindow, Menu, app, dialog} = require('electron')
const project = require('../project')
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
          util.openProject()
        }
      },
      {
        label: 'Close Project',
        accelerator: 'CommandOrControl+W',
        enabled: project.project !== null,
        click () {
          project.closeProject()
        }
      },
      {
        label: 'Save Project',
        accelerator: 'CommandOrControl+S',
        enabled: project.project !== null,
        click () {
          project.saveProject()
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
    // TODO test accelerators on other platforms
    // On my linux machine it won't detect when the
    // accelerators for cut, copy, and paste are
    // pressed. I can get around it by also holding down
    // the windows key. I suspect the OS isn't passing
    // the input to the application, but I don't
    // know if that'll affect other OSes or not.
    // Worst case scenario is they use the application
    // menu to perform those actions, which still works
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
      }
    ]
  },
  {
    label: 'Project',
    enabled: project.project !== null,
    submenu: []
  }
]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)

exports.updateMenu = function() {
  var enabled = project.project !== null
  menu.items[0].submenu.items[1].enabled = enabled
  menu.items[0].submenu.items[2].enabled = enabled
  menu.items[2].enabled = enabled
}
