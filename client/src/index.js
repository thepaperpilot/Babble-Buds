import React from 'react'
import ReactDOM, { unstable_batchedUpdates } from 'react-dom'
import {createStore, applyMiddleware, compose} from 'redux'
import {Provider} from 'react-redux'
import logger from 'redux-logger'
import thunk from 'redux-thunk'
import { batchedSubscribe } from 'redux-batched-subscribe'
import PopoutApp from './Popout-App'
import MainApp from './App'
import util from './redux/util.js'
import rootReducer from './redux/index'

import './index.css'

let store
let App
if (process.env.REACT_APP_POPOUT === "true") {
	const reducer = util.createReducer({}, {
	    SET_STATE: (state, action) => action.state
	})
	const enhancer = compose(
	    applyMiddleware(logger, thunk),
	    batchedSubscribe(unstable_batchedUpdates)
	)
	store = createStore(reducer, enhancer)
	App = PopoutApp
} else {
	const reducer = rootReducer
	const enhancer = compose(
	    applyMiddleware(logger, thunk),
	    batchedSubscribe(unstable_batchedUpdates)
	)
	store = createStore(reducer, enhancer)
	App = MainApp
}

ReactDOM.render(
    <Provider store={store}>
        <App />
    </Provider>,
    document.getElementById('root')
)
