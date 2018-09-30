const {globalShortcut, ipcMain} = require('electron')

ipcMain.on('global', (e, toRemove, toRegister) => {
    toRemove.forEach(o => {
        if (o.accel && globalShortcut.isRegistered(o.accel))
            globalShortcut.unregister(o.accel)
    })
    toRegister.forEach(o => {
        if (o.accel) {
            globalShortcut.register(o.accel, () => {
                let action
                switch (o.shortcut) {
                case 'Toggle babbling':
                    e.sender.send('babbleToggle')
                    return
                case 'Move left':
                    action = { type: 'MOVE_LEFT_SELF' }
                    break
                case 'Move right':
                    action = { type: 'MOVE_RIGHT_SELF' }
                    break
                case 'Jiggle':
                    action = { type: 'JIGGLE_SELF' }
                    break
                default: {
                    const words = o.shortcut.split(' ')
                    if (words[1] && words[1] === 'puppet') {
                        action = {
                            type: 'CHANGE_PUPPET_SELF',
                            index: words[2] - 1
                        }
                    } else if (words[1] && words[1] === 'emote') {
                        action = {
                            type: 'SET_EMOTE_SELF',
                            index: words[2] - 1
                        }
                    }
                    break
                }
                }
                e.sender.send('dispatch', action)
            })
        }
    })
})
