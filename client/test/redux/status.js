import chai, { expect } from 'chai'
import chaiRedux from 'chai-redux'
import thunk from 'redux-thunk'
import { combineReducers } from 'redux'
import status, { info, log, warn, error, inProgress, inProgressIncrement } from '../../src/redux/status'

chai.use(chaiRedux)

let store

describe('redux/status', () => {
    beforeEach(() => {
        store = chai.createReduxStore({ reducer: combineReducers({ status }), middleware: thunk })
    })

    it('should add info status', () => {
        store.dispatch(info('info test'))
        expect(store).to.have.state.like({
            status: [ {  message: 'info test', type: 'info' } ]
        })
    })

    it('should add log status', () => {
        store.dispatch(log('log test'))
        expect(store).to.have.state.like({
            status: [ {  message: 'log test', type: 'log' } ]
        })
    })

    it('should add warn status', () => {
        store.dispatch(warn('warn test'))
        expect(store).to.have.state.like({
            status: [ {  message: 'warn test', type: 'warn' } ]
        })
    })

    it('should add error status', () => {
        const err = new Error('dummy')
        store.dispatch(error('error test', err))
        expect(store).to.have.state.like({
            status: [ {  message: 'error test', type: 'error', error: err } ]
        })
    })

    it('should handle multiple statuses', () => {
        store.dispatch(info('info test'))
        store.dispatch(log('log test'))
        store.dispatch(warn('warn test'))
        const err = new Error('dummy')
        store.dispatch(error('error test', err))
        store.dispatch(info('info test2'))
        
        expect(store).to.have.state.like({
            status: [
                {  message: 'info test', type: 'info' },
                {  message: 'log test', type: 'log' },
                {  message: 'warn test', type: 'warn' },
                {  message: 'error test', type: 'error', error: err },
                {  message: 'info test2', type: 'info' }
            ]
        })
    })

    it('should add inProgress status', () => {
        store.dispatch(inProgress('dummy', 10, 'this is a dummy status'))
        expect(store).to.have.state.like({ status: [ {
            id: 'dummy',
            type: 'log',
            content: 'this is a dummy status',
            message: 'this is a dummy status (0/10)',
            total: 10,
            count: 0
        }]})
    })

    it('should update inProgress status count', () => {
        store.dispatch(inProgress('dummy', 10, 'this is a dummy status'))
        store.dispatch(inProgress('dummy', 2))
        expect(store).to.have.state.like({ status: [ {
            id: 'dummy',
            type: 'log',
            content: 'this is a dummy status',
            message: 'this is a dummy status (2/10)',
            total: 10,
            count: 2
        }]})
    })

    it('should update inProgressIncrement status count', () => {
        store.dispatch(inProgress('dummy', 10, 'this is a dummy status'))
        store.dispatch(inProgressIncrement('dummy', 3))
        store.dispatch(inProgressIncrement('dummy', 3))
        
        expect(store).to.have.state.like({ status: [ {
            id: 'dummy',
            type: 'log',
            content: 'this is a dummy status',
            message: 'this is a dummy status (6/10)',
            total: 10,
            count: 6
        }]})
    })

    it('should update multiple inProgress statuses', () => {
        store.dispatch(inProgress('dummy', 10, 'this is a dummy status'))
        store.dispatch(inProgress('dummy2', 8, 'this is a dummy status also'))
        store.dispatch(log('log test'))

        store.dispatch(inProgress('dummy', 3))
        store.dispatch(inProgressIncrement('dummy2', 2))
        store.dispatch(inProgress('dummy', 5))
        store.dispatch(inProgressIncrement('dummy2', 5))
        
        expect(store).to.have.state.like({ status: [
            { id: 'dummy', type: 'log', content: 'this is a dummy status', message: 'this is a dummy status (5/10)', total: 10, count: 5 },
            { id: 'dummy2', type: 'log', content: 'this is a dummy status also', message: 'this is a dummy status also (7/8)', total: 8, count: 7 },
            { type: 'log', message: 'log test' }
        ]})
    })
})
