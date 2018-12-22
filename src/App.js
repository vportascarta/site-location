import React, {Component} from 'react';
import Header from './components/header/Header';
import {Route, Switch} from 'react-router-dom';
import Home from './pages/home/Home';
import NoMatch from './pages/NoMatch'

class App extends Component {
    render() {
        return (
            <div className="App">
                <Header/>
                <Switch>
                    <Route path="/" exact component={Home}/>
                    {/*
                    <Route path="/tignes" component={About} />
                    <Route path="/faro" component={Users} />
                    <Route path="/contact" component={Users} />
                    */}
                    <Route component={NoMatch}/>
                </Switch>
            </div>
        );
    }
}

export default App;
