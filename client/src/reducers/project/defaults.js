// taken from https://wiki.urealms.com/wiki/List_of_Minor_Characters - Updated 2018-01-08
import names from './../../data/names.json'

const remote = window.require('electron').remote

export const DEFAULTS = {
    settings: {
        'clientVersion': remote.app.getVersion(),
        'numCharacters': 5,
        'puppetScale': 1,
        'greenScreen': '#00FF00',
        'greenScreenEnabled': false,
        'alwaysOnTop': false,
        'ip': 'babblebuds.xyz',
        'port': 8080,
        'roomName': 'lobby',
        'roomPassword': '',
        'roomNumCharacters': 5,
        'roomPuppetScale': 1,
        'nickname': names[Math.floor(Math.random() * names.length)],
        'charactersPath': '../characters',
        'assetsPath': '../assets',
        folders: [],
        'characters': [
            {
                'name': '',
                'id': 1,
                'location': '1.json'
            }
        ],
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
        'actor': {
            'id': 1,
            'position': 1,
            'facingLeft': false,
            'emote': 0
        },
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
    },
    project: null,
    oldSettings: '',
    characters: {},
    characterThumbnails: {},
    assets: {},
    charactersPath: '',
    assetsPath: '',
    numCharacters: 0
}

export const DEFAULT_CHARACTER = {
    'deadbonesStyle': false,
    'name': 'New Puppet',
    'layers': {
        children: []
    }
}
