import React from 'react'
import ReactDOM, { unstable_batchedUpdates } from 'react-dom'
import {createStore, applyMiddleware, compose} from 'redux'
import {Provider} from 'react-redux'
import logger from 'redux-logger'
import thunk from 'redux-thunk'
import { batchedSubscribe } from 'redux-batched-subscribe'
import App from './App'
import reducer from './redux/index'

import './index.css'

const enhancer = compose(
    applyMiddleware(logger, thunk),
    batchedSubscribe(unstable_batchedUpdates)
)
const store = createStore(reducer, enhancer)

ReactDOM.render(
    <Provider store={store}>
        <App />
    </Provider>,
    document.getElementById('root')
)
