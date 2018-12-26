import React from 'react';
import {withNamespaces} from 'react-i18next';
import ReCAPTCHA from 'react-google-recaptcha';

class Captcha extends React.Component {
    render() {
        const {lng, onChange} = this.props;
        window.recaptchaOptions = {
            lang: lng,
            removeOnUnmount: true,
        };

        return (
            <React.Fragment>
                <ReCAPTCHA
                    sitekey='6Lde1oQUAAAAANzSwRSGDb3Ibp_FltNggQ5ZEdHc'
                    onChange={onChange}
                />
            </React.Fragment>
        )
    }
}

export default withNamespaces()(Captcha);