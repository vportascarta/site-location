import React from 'react';
import {withNamespaces} from 'react-i18next';
import {Jumbotron} from 'reactstrap';
import './Contact.css';

class Contact extends React.Component {
    render() {
        const {t} = this.props;

        return (
            <React.Fragment>
                <div className='contact-header'>
                    <Jumbotron>
                        <h1 className="display-3">{t('contact_title')}</h1>
                        <p className="lead">{t('contact_subtitle')}</p>
                    </Jumbotron>
                </div>

                <div style={{padding: '20px'}}>
                    <h1>{t('soon')}</h1>
                </div>
            </React.Fragment>
        )
    }
}

export default withNamespaces()(Contact);