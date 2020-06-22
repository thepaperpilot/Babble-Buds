import util from './util.js'
import names from '../data/names.json'

const remote = window.require('electron').remote

export default util.createReducer({
    character: {
        'deadbonesStyle': false,
        'name': 'New Puppet',
        'layers': {
            children: []
        }
    },
    environment: {
        'name': 'Default',
        'color': '#242a33',
        'themeApp': true,
        'width': 1920,
        'height': 1080,
        'layers': {
            children: [
                {
                    id: 'CHARACTER_PLACEHOLDER',
                    leaf: 'true',
                    name: 'PUPPETS',
                    rotation: 0,
                    scaleX: 1,
                    scaleY: 1,
                    x: 0,
                    y: 0
                }
            ]
        },
        'numCharacters': 5,
        'puppetScale': 1
    },
    settings: {
        'clientVersion': remote.app.getVersion(),
        'alwaysOnTop': false,
        'networking': {
            'ip': 'babblebuds.xyz',
            'port': 8080,
            'roomName': 'lobby',
            'roomPassword': '',
        },
        'nickname': names[Math.floor(Math.random() * names.length)],
        'charactersPath': '../characters',
        'assetsPath': '../assets',
        'characters': [
            {
                'id': 1,
                'location': '1.json'
            }
        ],
        'environments': [],
        'hotbar': [
            1,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0
        ],
        'environmentHotbar': [
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0
        ],
        'shortcuts': {
            'Select puppet 1': null,
            'Select puppet 2': null,
            'Select puppet 3': null,
            'Select puppet 4': null,
            'Select puppet 5': null,
            'Select puppet 6': null,
            'Select puppet 7': null,
            'Select puppet 8': null,
            'Select puppet 9': null,
            'Select environment 1': null,
            'Select environment 2': null,
            'Select environment 3': null,
            'Select environment 4': null,
            'Select environment 5': null,
            'Select environment 6': null,
            'Select environment 7': null,
            'Select environment 8': null,
            'Select environment 9': null,
            'Select emote 1': null,
            'Select emote 2': null,
            'Select emote 3': null,
            'Select emote 4': null,
            'Select emote 5': null,
            'Select emote 6': null,
            'Select emote 7': null,
            'Select emote 8': null,
            'Select emote 9': null,
            'Select emote 10': null,
            'Select emote 11': null,
            'Select emote 12': null,
            'Toggle babbling': null,
            'Move left': null,
            'Move right': null,
            'Jiggle': null,
        }
    }
}, {})
