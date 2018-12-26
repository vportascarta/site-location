import i18n from 'i18next';
import detector from 'i18next-browser-languagedetector';
import {reactI18nextModule} from 'react-i18next';

import translationEN from './locales/en/translations.json';
import translationFR from './locales/fr/translations.json';

import moment from 'moment';
import 'moment/locale/fr';

moment.locale('fr');

const resources = {
    fr: {
        translation: translationFR
    },
    en: {
        translation: translationEN
    }
};

i18n
    .use(detector)
    .use(reactI18nextModule)
    .init({
        resources,
        fallbackLng: 'fr',

        keySeparator: false, // we do not use keys in form messages.welcome

        interpolation: {
            escapeValue: false
        }
    });

export default i18n;