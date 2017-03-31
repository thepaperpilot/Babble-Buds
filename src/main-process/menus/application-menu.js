const {BrowserWindow, Menu, app, dialog} = require('electron')
const project = require('../project')
const util = require('../util')
const path = require('path')

// Create menu
const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Open Project',
        accelerator: 'CommandOrControl+O',
        click (item, focusedWindow) {
          util.openProject()
        }
      },
      {
        label: 'Close Project',
        accelerator: 'CommandOrControl+W',
        enabled: project.project != null,
        click () {
          // TODO prompt user to save if there are unsaved changes
          project.closeProject()
        }
      },
      {
        label: 'Save Project',
        accelerator: 'CommandOrControl+S',
        enabled: project.project != null,
        click () {
          // TODO save project
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
    label: 'Edit',
    submenu: []
  },
  {
    label: 'Project',
    enabled: project.project != null,
    submenu: []
  }
]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)

exports.updateMenu = function() {
  var enabled = project.project != null
  menu.items[0].submenu.items[1].enabled = enabled
  menu.items[0].submenu.items[2].enabled = enabled
  menu.items[2].enabled = enabled
}
