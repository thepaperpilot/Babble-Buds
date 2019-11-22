import '../../util/mock-electron'
import chai, { expect } from 'chai'
import { loadCharacters, loadAssets } from '../../../src/redux/project/loader'
import path from 'path'

const charactersPath = path.join(__dirname, '..', '..', 'test-data', 'characters')
const assetsPath = path.join(__dirname, '..', '..', 'test-data', 'assets')

const defaults = {
    character: {
        layers: {
            children: []
        }
    },
    environment: {
        layers: {
            children: []
        }
    }
}

describe('redux/project/loader', function () {
    it('should error if loading character from non-existent file', () => {
        const settings = {
            characters: [ { location: 'doesn\'t exist', id: 1 } ],
            environments: []
        }
        expect(loadCharacters(settings, charactersPath, defaults).characterErrors).to.have.lengthOf(1)
    })

    it('should error if loading character from non-json file', () => {
        const settings = {
            characters: [ { location: 'invalid.json', id: 1 } ],
            environments: []
        }
        expect(loadCharacters(settings, charactersPath, defaults).characterErrors).to.have.lengthOf(1)
    })

    it('should handle loading empty character', () => {
        const settings = {
            characters: [ { location: 'empty.json', id: 1 } ],
            environments: []
        }
        expect(loadCharacters(settings, charactersPath, defaults).characters[1]).to.exist
    })

    it('should load characters', () => {
        const settings = {
            characters: [ { location: 'character.json', id: 1 } ],
            environments: []
        }
        expect(loadCharacters(settings, charactersPath, defaults).characters[1]).to.exist
    })

    it('should load multiple characters', () => {
        const settings = {
            characters: [
                { location: 'character.json', id: 1 },
                { location: 'character.json', id: 2 },
                { location: 'character.json', id: 3 }
            ],
            environments: []
        }
        const characters = loadCharacters(settings, charactersPath, defaults).characters
        expect(characters[1].layers.children).to.have.lengthOf(1)
        expect(characters[2].layers.children).to.have.lengthOf(1)
        expect(characters[3].layers.children).to.have.lengthOf(1)
    })

    it('should handle loading from empty settings', () => {
        const settings = {}
        expect(loadCharacters(settings, charactersPath, defaults).characters).to.be.empty
    })

    it('should error if loading from non-existent charactersPath', () => {
        const settings = {
            characters: [ { location: 'character.json', id: 1 } ],
            environments: []
        }
        expect(loadCharacters(settings, '', defaults).characterErrors).to.have.lengthOf(1)
    })

    it('should error if loading environment from non-existent file', () => {
        const settings = {
            characters: [],
            environments: [ { location: 'doesn\'t exist', id: 1 } ]
        }
        expect(loadCharacters(settings, charactersPath, defaults).environmentErrors).to.have.lengthOf(1)
    })

    it('should error if loading environment from non-json file', () => {
        const settings = {
            characters: [],
            environments: [ { location: 'invalid.json', id: 1 } ]
        }
        expect(loadCharacters(settings, charactersPath, defaults).environmentErrors).to.have.lengthOf(1)
    })

    it('should handle loading empty environment', () => {
        const settings = {
            characters: [],
            environments: [ { location: 'empty.json', id: 1 } ]
        }
        expect(loadCharacters(settings, charactersPath, defaults).environments[1]).to.exist
    })

    it('should load environments', () => {
        const settings = {
            characters: [],
            environments: [ { location: 'environment.json', id: 1 } ]
        }
        expect(loadCharacters(settings, charactersPath, defaults).environments[1]).to.exist
    })

    it('should load multiple environments', () => {
        const settings = {
            characters: [],
            environments: [
                { location: 'environment.json', id: 1 },
                { location: 'environment.json', id: 2 },
                { location: 'environment.json', id: 3 }
            ]
        }
        const environments = loadCharacters(settings, charactersPath, defaults).environments
        expect(environments[1].layers.children).to.have.lengthOf(1)
        expect(environments[2].layers.children).to.have.lengthOf(1)
        expect(environments[3].layers.children).to.have.lengthOf(1)
    })

    it('should load pre-emotes update characters', () => {
        const settings = {
            characters: [ { location: 'oldEmotesCharacter.json', id: 1 } ],
            environments: []
        }
        expect(loadCharacters(settings, charactersPath, defaults).characters[1].layers.children[0].children).to.eql([
            {"name":"default","emote":0,"children":[],"inherit":{"head":true},"path":[0,0]},
            {"name":"happy","emote":1,"children":[],"inherit":{"head":true},"path":[0,1]}
        ])
    })

    it('should load pre-layers update characters', () => {
        const settings = {
            characters: [ { location: 'oldLayersCharacter.json', id: 1 } ],
            environments: []
        }
        // this could probably be a tad more thorough
        expect(loadCharacters(settings, charactersPath, defaults).characters[1].layers.children).to.have.lengthOf(2)
    })

    it('should error if loading assets from non-existent file', () => {
        expect(loadAssets({}, path.join(assetsPath, 'doesn\'t exist'), []).error).to.exist
    })

    it('should error if loading assets from non-json file', () => {
        expect(loadAssets({}, path.join(assetsPath, 'invalid'), []).error).to.exist
    })

    it('should handle empty assets file', () => {
        expect(Object.keys(loadAssets({}, path.join(assetsPath, 'empty'), []).assets)).to.be.empty
    })

    it('should load assets', () => {
        expect(Object.keys(loadAssets({}, path.join(assetsPath, 'assets'), []).assets)).to.have.lengthOf(1)
    })

    it('should load assets in settings', () => {
        const settings = {
            assets: [
                { name: 'assets', location: 'assets.json' }
            ]
        }
        const characters = [
            {
                "deadbonesStyle": false,
                "name": "New Puppet",
                "layers": {
                    "children": [ { tab: 'assets', hash: 'testid' } ]
                }
            }
        ]
        const assets = loadAssets(settings, path.join(assetsPath, 'old'), characters)
        expect(Object.keys(assets.assets)).to.have.lengthOf(1)
        expect(characters[0].layers.children[0].tab).to.not.exist
        expect(characters[0].layers.children[0].hash).to.not.exist
        expect(characters[0].layers.children[0].id).to.exist
    })

    it('should warn if loading assets in settings with non-existent file', () => {
        const settings = {
            assets: [
                { name: 'assets', location: 'doesn\'t exist.json' }
            ]
        }
        const characters = [
            {
                "deadbonesStyle": false,
                "name": "New Puppet",
                "layers": {
                    "children": [ { tab: 'assets', hash: 'testid' } ]
                }
            }
        ]
        const assets = loadAssets(settings, path.join(assetsPath, 'old'), characters)
        expect(Object.keys(assets.errors)).to.have.lengthOf(1)
        expect(characters[0].layers.children).to.be.empty
    })

    it('should warn if loading assets in settings with non-json file', () => {
        const settings = {
            assets: [
                { name: 'assets', location: 'assets.json' }
            ]
        }
        const characters = [
            {
                "deadbonesStyle": false,
                "name": "New Puppet",
                "layers": {
                    "children": [ { tab: 'assets', hash: 'testid' } ]
                }
            }
        ]
        const assets = loadAssets(settings, path.join(assetsPath, 'invalid'), characters)
        expect(Object.keys(assets.errors)).to.have.lengthOf(1)
        expect(characters[0].layers.children).to.be.empty
    })
})
