import React, {Component} from 'react'

const electron = window.require('electron')

class PopoutKeyboardListener extends Component {
    constructor(props) {
        super(props)

        this.keyDown = this.keyDown.bind(this)
        this.keyUp = this.keyUp.bind(this)
    }

    componentDidMount() {
        window.addEventListener('keydown', this.keyDown)
        window.addEventListener('keyup', this.keyUp)
    }

    componentWillUnmount() {
        window.removeEventListener('keydown', this.keyDown)
        window.removeEventListener('keyup', this.keyUp)
    }

    emit(command, data) {
        electron.ipcRenderer.send('foreground', 'dispatch', command, data)
    }

    // TODO abstract keyDown and keyUp listeners between popout and main window
    keyDown(e) {
        // Holding down emits events very quickly, and I want to ignore those
        if (e.repeat) return


        if (e.ctrlKey && e.keyCode === 80)
            electron.remote.ipcMain.emit('toggle popout visibility')
        
        if (e.keyCode > 48 && e.keyCode < 58) {
            if (e.shiftKey)
                this.emit("changeEnvironment", e.keyCode - 49)
            else
                this.emit("changePuppet", e.keyCode - 49)
        } else if (!e.shiftKey && !e.ctrlKey) switch(e.keyCode) {
        case 32:
            this.emit("setBabbling", true);
            if (e.preventDefault) e.preventDefault();
            break
        case 85: this.emit("setEmote", 0); break
        case 73: this.emit("setEmote", 1); break
        case 79: this.emit("setEmote", 2); break
        case 80: this.emit("setEmote", 3); break
        case 74: this.emit("setEmote", 4); break
        case 75: this.emit("setEmote", 5); break
        case 76: this.emit("setEmote", 6); break
        case 186: this.emit("setEmote", 7); break
        case 77: this.emit("setEmote", 8); break
        case 188: this.emit("setEmote", 9); break
        case 190: this.emit("setEmote", 10); break
        case 191: this.emit("setEmote", 11); break
        case 37: this.emit("moveLeft"); break
        case 39: this.emit("moveRight"); break
        case 38:case 66: this.emit("jiggle"); break
        case 27: electron.remote.ipcMain.emit('toggle popout visibility'); break;
        default: break
        }
    }

    keyUp(e) {
        if (e.keyCode == 32) {
            this.emit("setBabbling", false)
        }
    }

    render() {
        return null
    }
}

export default PopoutKeyboardListener
