import chai, { expect } from 'chai'
import chaiRedux from 'chai-redux'
import thunk from 'redux-thunk'
import { combineReducers } from 'redux'
import networking,
    { setNetworking, setIP, setPort, setRoomName, setRoomPassword }
    from '../../../../src/redux/project/settings/networking'

chai.use(chaiRedux)

const reducer = combineReducers({
    project: combineReducers({
        settings: combineReducers({
            networking
        })
    })
})

const middleware = thunk

const defaultNetwork = {
    ip: 'babblebuds.xyz',
    port: 8080,
    roomName: 'lobby',
    roomPassword: ''
}
const updatedNetwork = {
    ip: 'test-babblebuds-site.com',
    port: 8088,
    roomName: 'test-lobby',
    roomPassword: 'hunter2'
}

describe('redux/project/settings/networking', function () {
    it('should set networking', () => {
        const initialState = {
            project: {
                settings: {
                    networking: defaultNetwork
                }
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(setNetworking(updatedNetwork))
        expect(store).to.have.state.like({
            project: {
                settings: {
                    networking: updatedNetwork
                }
            }
        })
    })

    it('should set ip', () => {
        const initialState = {
            project: {
                settings: {
                    networking: defaultNetwork
                }
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(setIP(updatedNetwork.ip))
        expect(store).to.have.state.like({
            project: {
                settings: {
                    networking: {
                        ...defaultNetwork,
                        ip: updatedNetwork.ip
                    }
                }
            }
        })
    })

    it('should set port', () => {
        const initialState = {
            project: {
                settings: {
                    networking: defaultNetwork
                }
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(setPort(updatedNetwork.port))
        expect(store).to.have.state.like({
            project: {
                settings: {
                    networking: {
                        ...defaultNetwork,
                        port: updatedNetwork.port
                    }
                }
            }
        })
    })

    it('should set room name', () => {
        const initialState = {
            project: {
                settings: {
                    networking: defaultNetwork
                }
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(setRoomName(updatedNetwork.roomName))
        expect(store).to.have.state.like({
            project: {
                settings: {
                    networking: {
                        ...defaultNetwork,
                        roomName: updatedNetwork.roomName
                    }
                }
            }
        })
    })

    it('should set room password', () => {
        const initialState = {
            project: {
                settings: {
                    networking: defaultNetwork
                }
            }
        }
        const store = chai.createReduxStore({ reducer, middleware, initialState })

        store.dispatch(setRoomPassword(updatedNetwork.roomPassword))
        expect(store).to.have.state.like({
            project: {
                settings: {
                    networking: {
                        ...defaultNetwork,
                        roomPassword: updatedNetwork.roomPassword
                    }
                }
            }
        })
    })
})
