import React from 'react';
import {withNamespaces} from 'react-i18next';
import {Jumbotron} from 'reactstrap';
import './Tignes.css';

class Tignes extends React.Component {
    render() {
        const {t} = this.props;

        return (
            <React.Fragment>
                <div className='tignes-header'>
                    <Jumbotron>
                        <h1 className="display-3">{t('tignes_title')}</h1>
                        <p className="lead">{t('tignes_subtitle')}</p>
                    </Jumbotron>
                </div>

                <div style={{padding: '20px'}}>
                    <h1>{t('soon')}</h1>
                </div>
            </React.Fragment>
        )
    }
}

export default withNamespaces()(Tignes);