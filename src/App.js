import React, {Component} from 'react';
import {Route} from 'react-router-dom';
import {AnimatedSwitch} from 'react-router-transition';
import Header from './components/header/Header';
import Home from './pages/home/Home';
import Tignes from './pages/tignes/Tignes'
import Faro from './pages/faro/Faro'
import Contact from './pages/contact/Contact'
import NoMatch from './pages/NoMatch'

class App extends Component {
    render() {
        return (
            <div className="App">
                <Header/>
                <div className="header-space"/>
                <AnimatedSwitch
                    atEnter={{opacity: 0}}
                    atLeave={{opacity: 0}}
                    atActive={{opacity: 1}}
                    className="switch-wrapper"
                >
                    <Route path="/" exact component={Home}/>
                    <Route path="/tignes" component={Tignes}/>
                    <Route path="/faro" component={Faro}/>
                    <Route path="/contact" component={Contact}/>
                    <Route component={NoMatch}/>
                </AnimatedSwitch>
            </div>
        );
    }
}

export default App;
