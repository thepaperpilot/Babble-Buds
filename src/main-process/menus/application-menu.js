const {BrowserWindow, Menu, app, dialog, shell} = require('electron')
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
        label: 'Toggle Popout',
        accelerator: 'CommandOrControl+P',
        click (item, focusedWindow) {
          focusedWindow.webContents.send('togglePopout')
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
        click (item, focusedWindow) {
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
        click (item, focusedWindow) {
          shell.openExternal("https://github.com/thepaperpilot/Babble-Buds")
        }
      },
      {
        label: 'URealms Forums Page',
        click (item, focusedWindow) {
          shell.openExternal("https://forums.urealms.com/discussion/272/alpha-babble-buds-a-virtual-puppet-show-software/p1")
        }
      },
      {
        label: 'Changelog',
        click (item, focusedWindow) {
          shell.openExternal("https://github.com/thepaperpilot/Babble-Buds/releases")
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

exports.updateMenu = function() {
  let enabled = settings.settings.openProject !== ""
  menu.items[0].submenu.items[1].enabled = enabled
  menu.items[0].submenu.items[2].enabled = enabled
  for (let i = 2; i <= 3; i++) {
    for (let j = 0; j < menu.items[i].submenu.items.length; j++) {
      menu.items[i].submenu.items[j].enabled = enabled
    }
  }
  // Y u no work?
  // menu.items[2].enabled = enabled
  // menu.items[3].enabled = enabled
}
