const {globalShortcut, ipcMain} = require('electron')

ipcMain.on('global', (e, toRemove, toRegister) => {
    toRemove.forEach(o => {
        if (o.accel && globalShortcut.isRegistered(o.accel))
            globalShortcut.unregister(o.accel)
    })
    toRegister.forEach(o => {
        if (o.accel) {
            globalShortcut.register(o.accel, () => {
                let action, data
                switch (o.shortcut) {
                case 'Toggle babbling':
                    e.sender.send('babbleToggle')
                    return
                case 'Move left':
                    action = 'moveLeft'
                    break
                case 'Move right':
                    action = 'moveRight'
                    break
                case 'Jiggle':
                    action = 'jiggle'
                    break
                default: {
                    const words = o.shortcut.split(' ')
                    data = words[2]- 1
                    if (words[1] && words[1] === 'puppet') {
                        action = 'changePuppet'
                    } else if (words[1] && words[1] === 'environment') {
                        action = 'changeEnvironment'
                    } else if (words[1] && words[1] === 'emote') {
                        action = 'setEmote'
                    }
                    break
                }
                }
                e.sender.send('dispatch', action, data)
            })
        }
    })
})
