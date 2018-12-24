import React from 'react';
import {withNamespaces} from 'react-i18next';
import {
    Button,
    Card,
    CardDeck,
    CardImg,
    CardImgOverlay,
    CardSubtitle,
    CardText,
    CardTitle,
    Jumbotron
} from 'reactstrap';
import './Home.css';
import tignesIMG from '../../assets/tignes.webp'
import faroIMG from '../../assets/faro.webp'
import {Link} from 'react-router-dom';

class Home extends React.Component {
    render() {
        const {t} = this.props;

        return (
            <React.Fragment>
                <div className='home-header'>
                    <Jumbotron>
                        <h1 className="display-3">{t('home_welcome')}</h1>
                        <p className="lead">{t('home_welcome_subtitle')}</p>
                        <hr className="my-2"/>
                        <p>{t('home_welcome_text')}</p>
                    </Jumbotron>
                </div>

                <div style={{padding: '20px'}}>
                    <h1>{t('home_card_title')}</h1>

                    <CardDeck>
                        <Card>
                            <CardImg top width="100%" src={tignesIMG} alt={t('tignes_title')}/>
                            <CardImgOverlay>
                                <div className="bg-semitransparent">
                                    <CardTitle>{t('tignes_title')}</CardTitle>
                                    <CardSubtitle>{t('tignes_subtitle')}</CardSubtitle>
                                    <CardText className="block-with-text">{t('random')}</CardText>
                                    <Button tag={Link} to="/tignes">{t('more_info')}</Button>
                                </div>
                            </CardImgOverlay>
                        </Card>
                        <Card>
                            <CardImg top width="100%" src={faroIMG} alt={t('faro_title')}/>
                            <CardImgOverlay>
                                <div className="bg-semitransparent">
                                    <CardTitle>{t('faro_title')}</CardTitle>
                                    <CardSubtitle>{t('faro_subtitle')}</CardSubtitle>
                                    <CardText className="block-with-text">{t('random')}</CardText>
                                    <Button tag={Link} to="/faro">{t('more_info')}</Button>
                                </div>
                            </CardImgOverlay>
                        </Card>
                    </CardDeck>
                </div>
            </React.Fragment>
        )
    }
}

export default withNamespaces()(Home);