import React, { Component } from 'react'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import Home from './components/Home.jsx'
import Admin from './components/Admin.jsx'
import NotFound from './components/NotFound.jsx'
 
export default class App extends Component {
    render() {
        return <Router>
            <Header />
            <Switch>
                <Route exact path="/">
                    <Home />
                </Route>
                <Route exact path="/admin">
                    <Admin />
                </Route>
                <Route>
                    <NotFound />
                </Route>
            </Switch>
        </Router>
    }
}
