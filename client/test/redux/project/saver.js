import '../../util/mock-electron'
import chai, { expect } from 'chai'
import chaiRedux from 'chai-redux'
import thunk from 'redux-thunk'
import { combineReducers } from 'redux'
import fakeReducer from '../../util/fakeReducer'
import saver, { save, load} from '../../../src/redux/project/saver'
import path from 'path'
import fs from 'fs-extra'

chai.use(chaiRedux)

const reducer = combineReducers({
    project: combineReducers({
        saver,
        project: fakeReducer,
        settings: fakeReducer,
        characters: fakeReducer,
        environments: fakeReducer,
        assets: fakeReducer
    })
})

const middleware = thunk

const projectFolder = path.join(__dirname, '..', '..', 'test-saver-data')
const projectFile = path.join(projectFolder, 'project.babblemm')

describe('redux/project/saver', function () {
    before(() => {
        fs.ensureDirSync(projectFolder)
    })

    after(() => {
        fs.removeSync(projectFolder)
    })

    it("should load", () => {
        const initialState = {
            project: {
                saver: {}
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        const settings = { "settings": "settings" }
        const characters = { "characters": "characters" }
        const environments = { "environments": "environments" }
        const assets = { "assets": "assets" }
        store.dispatch(load(settings, characters, environments, assets))
        expect(store).to.have.state.like({
            project: {
                ...store.getState().project,
                saver: {
                    settings: JSON.stringify(settings),
                    characters: JSON.stringify(characters),
                    environments: JSON.stringify(environments),
                    assets: JSON.stringify(assets)
                }
            }
        })
    })

    it('should save', () => {
        const settings = {
            charactersPath: '',
            assetsPath: '..',
            characters: [
                { id: 0, location: '0.json' }
            ],
            environments: [
                { id: 1, location: '1.json' }
            ]
        }
        const characters = {
            0: {}
        }
        const environments = {
            1: {}
        }
        const assets = {
            test: {}
        }
        const initialState = {
            project: {
                project: projectFile,
                settings,
                characters,
                environments,
                assets
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(save())
        expect(store).to.have.state.like({
            project: {
                ...store.getState().project,
                saver: {
                    settings: JSON.stringify(settings),
                    characters: JSON.stringify(characters),
                    environments: JSON.stringify(environments),
                    assets: JSON.stringify(assets)
                }
            }
        })
        expect(fs.readJsonSync(projectFile)).to.eql(settings)
    })
})
