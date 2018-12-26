import React from 'react';
import {withNamespaces} from 'react-i18next';
import {AvField, AvForm} from 'availity-reactstrap-validation';
import {Button, Jumbotron, Modal, ModalBody, ModalFooter, ModalHeader} from 'reactstrap';
import Captcha from '../../components/captcha/Captcha';
import DateRangePickerWrapper from '../../components/dateRangePicker/DateRangePickerWrapper';
import './Contact.css';
import {Link} from 'react-router-dom';


class Contact extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            place_selected: null,
            data_sent: null
        }
    }

    handleValidSubmit = (event, values) => {
        fetch('https://us-central1-site-locations-porta.cloudfunctions.net/sendemail', {
            method: 'POST',
            headers: {'Content-Type': 'text/plain'},
            body: JSON.stringify(values)
        })
            .then((res) => {
                if (res.ok) {
                    this.setState({data_sent: true})
                } else {
                    this.setState({data_sent: false})
                }
            })
    };

    closeModal = () => {
        this.setState({data_sent: null})
    };

    render() {
        const {t, i18n} = this.props;
        window.recaptchaOptions = {
            lang: i18n.language,
            removeOnUnmount: true,
        };

        const {data_sent} = this.state;

        return (
            <React.Fragment>
                <div className='contact-header'>
                    <Jumbotron>
                        <h1 className="display-3">{t('contact_title')}</h1>
                        <p className="lead">{t('contact_subtitle')}</p>
                    </Jumbotron>
                </div>

                <div style={{padding: '20px'}}>
                    <h1>{t('form')}</h1>

                    <AvForm className='contact-form' onValidSubmit={this.handleValidSubmit}>
                        <AvField name="name" label={t('name')} type="text" required
                                 errorMessage={t('error_not_empty')}/>

                        <AvField name="senderMail" label={t('email')} type="email" validate={{
                            required: {value: true, errorMessage: t('error_not_empty')},
                            email: {value: true, errorMessage: t('error_valid_email')},
                        }}/>

                        <AvField name="place" label={t('place')} type="select" required
                                 errorMessage={t('error_not_empty')}
                                 onChange={(e) => this.setState({place_selected: e.target.value.toLocaleLowerCase()})}>
                            <option/>
                            <option>Tignes</option>
                            <option>Faro</option>
                        </AvField>

                        <AvField name="dates" label={t('dates')} required helpMessage={t('dates_help')}
                                 tag={DateRangePickerWrapper} location={this.state.place_selected}/>

                        <AvField name="message" label={t('message')} type="textarea"/>

                        <AvField name="captcha" label={t('validation')} required tag={Captcha}/>

                        <Button color="primary">{t('submit')}</Button>
                    </AvForm>


                    <Modal isOpen={data_sent !== null}>
                        <ModalHeader>{data_sent ? t('form_modal_title_success') : t('form_modal_title_error')}</ModalHeader>
                        <ModalBody>
                            {data_sent ? t('form_modal_body_success') : t('form_modal_body_error')}
                        </ModalBody>
                        <ModalFooter>
                            {data_sent ?
                                <Button tag={Link} to='/' color="success">{t('back')}</Button> :
                                <Button color="danger" onClick={this.closeModal}>{t('back')}</Button>
                            }
                        </ModalFooter>
                    </Modal>
                </div>
            </React.Fragment>
        )
    }
}

export default withNamespaces()(Contact);