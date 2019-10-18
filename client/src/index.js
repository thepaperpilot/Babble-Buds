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

window.PIXI.settings.SCALE_MODE = 0
//window.PIXI.settings.RESOLUTION = 4
window.PIXI.settings.ROUND_PIXELS = true
//window.PIXI.settings.PRECISION_FRAGMENT = 'highp'
//window.PIXI.settings.RENDER_OPTIONS.resolution = 4
window.PIXI.settings.RENDER_OPTIONS.antialias = true
//window.PIXI.settings.RENDER_OPTIONS.autoDensity = true
window.PIXI.settings.MIPMAP_TEXTURES = window.PIXI.MIPMAP_MODES.ON

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
