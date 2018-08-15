import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import {createStore} from 'redux'
import {Provider} from 'react-redux'
import './index.css'
import reducer from './reducers/index'

const store = createStore(reducer)

ReactDOM.render(
    <Provider store={store}>
        <App />
    </Provider>,
    document.getElementById('root')
)
