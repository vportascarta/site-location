import React from 'react';
import {withNamespaces} from 'react-i18next';
import './NoMatch.css';
import {Button, Jumbotron} from 'reactstrap';
import {Link} from 'react-router-dom';

class NoMatch extends React.Component {
    render() {
        const {t} = this.props;

        return (
            <React.Fragment>
                <div className="no-match">
                    <Jumbotron className="text-center">
                        <h1>{t('error')}</h1>
                        <h3>{t('404_text')}</h3>
                        <hr/>
                        <Button tag={Link} to="/">{t('back')}</Button>
                    </Jumbotron>
                </div>
            </React.Fragment>
        )
    }
}

export default withNamespaces()(NoMatch);