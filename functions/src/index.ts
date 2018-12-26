const functions = require('firebase-functions');
const admin = require('firebase-admin');
const {OAuth2Client} = require('google-auth-library');
const {google} = require('googleapis');
const nodemailer = require('nodemailer');
const fetch = require('node-fetch');
const credentials = require('../credentials.js');

// Interfaces
interface Period {
    start: Date,
    end: Date
}

interface PricePeriod {
    start: Date,
    end: Date
    price: number
}

enum Places {
    Tignes = 'tignes',
    Faro = 'faro'
}

interface InfoMail {
    name: string,
    senderMail: string,
    place: Places,
    dates: Period
    message: string,
    captcha: string
}

// Init App & Auth
admin.initializeApp(functions.config().firebase);
const db = admin.database();

const functionsOauthClient = new OAuth2Client(credentials.client_id, credentials.secret, credentials.redirect_url);
let oauthTokens = null;

const DB_TOKEN_PATH = '/api_tokens';
const DB_DISPO_PATH = '/dispo';
const DB_PRICES_PATH = '/prices';
const UPDATE_TIME = 10 * 60 * 1000; // 10 min

const mailConfig = {
    host: credentials.mail_server,
    port: 465,
    secure: true,
    auth: {
        user: credentials.mail_user,
        pass: credentials.mail_password
    }
};

// Visit the URL for this Function to request tokens
exports.authgoogleapi = functions.https.onRequest((req, res) => {
    db.ref(DB_TOKEN_PATH).once('value')
        .then((snapshot) => {
            const data = snapshot.val();

            if (data === undefined) {
                res.set('Cache-Control', 'private, max-age=0, s-maxage=0');
                res.redirect(functionsOauthClient.generateAuthUrl({
                    access_type: 'offline',
                    scope: credentials.scopes,
                    prompt: 'consent',
                }));
                return;
            } else {
                console.warn('Already connected');
                res.status(403).send('Already connected');
                return;
            }
        })
        .catch((err) => {
            console.error('An error as occur : ' + err);
            res.status(500).send('An error as occur : ' + err);
            return;
        })
});

// After you grant access, you will be redirected to the URL for this Function
// this Function stores the tokens to your Firebase database
exports.oauthcallback = functions.https.onRequest((req, res) => {
    res.set('Cache-Control', 'private, max-age=0, s-maxage=0');
    const code = req.query.code;
    functionsOauthClient.getToken(code, (err, tokens) => {
        // Now tokens contains an access_token and an optional refresh_token. Save them.
        if (err) {
            console.error('An error as occur : ' + err);
            res.status(500).send('An error as occur : ' + err);
            return;
        }
        return admin.database().ref(DB_TOKEN_PATH).set(tokens)
            .then(() => {
                console.info('App successfully configured with new Credentials.');
                res.status(200).send('App successfully configured with new Credentials. You can now close this page.');
                return;
            });
    });
});


// Helpers
// checks if oauthTokens have been loaded into memory, and if not, retrieves them
function getAuthorizedClient(): Promise<any> {
    return new Promise((resolve, reject) => {
        if (oauthTokens) {
            resolve(functionsOauthClient);
        }
        db.ref(DB_TOKEN_PATH).once('value').then((snapshot) => {
            oauthTokens = snapshot.val();
            functionsOauthClient.setCredentials(oauthTokens);
            resolve(functionsOauthClient);
        }).catch(() => reject());
    });
}

function readDataFromCalandar() {
    const config = {
        calendarId: credentials.calendar_id,
    };

    return new Promise((resolve, reject) => {
        return getAuthorizedClient()
            .then((auth) => {
                const calendar = google.calendar({version: 'v3', auth});
                return calendar.events.list(config, (err, response) => {
                    if (err) {
                        console.error('An error as occur : ' + err);
                        reject(err);
                    }
                    resolve(response.data.items);
                });
            })
            .catch((err) => reject(err));
    });
}

function readDataFromSheet(sheet_name: string) {
    const config = {
        spreadsheetId: credentials.sheet_id,
        range: sheet_name + '!A2:C100',
        majorDimension: 'ROWS',
    };

    return new Promise((resolve, reject) => {
        return getAuthorizedClient()
            .then((auth) => {
                const sheets = google.sheets({version: 'v4', auth});
                return sheets.spreadsheets.values.get(config, (err, response) => {
                    if (err) {
                        console.error('An error as occur : ' + err);
                        reject(err);
                    }
                    resolve(response.data.values);
                });
            })
            .catch((err) => reject(err));
    });
}

function fetchIndisponibility(location_name: Places): Promise<void> {
    return new Promise((resolve, reject) => {
        readDataFromCalandar()
            .then((data: [any]) => {
                const indispos: Period[] = [];

                for (const item of data) {
                    if (item.summary.toLocaleLowerCase() === location_name) {
                        indispos.push({
                            start: item.start.date,
                            end: item.end.date,
                        })
                    }
                }

                const res = {
                    updatedAt: Date.now(),
                    indispos
                };

                resolve(db.ref(DB_DISPO_PATH + `/${location_name}`).set(res));
            })
            .catch((err) => reject(err))
    });
}

function fetchPricePeriods(location_name: string): Promise<void> {
    return new Promise((resolve, reject) => {
        readDataFromSheet(location_name)
            .then((data: [any]) => {
                const prices: PricePeriod[] = [];

                for (const item of data) {
                    prices.push({
                        start: item[0],
                        end: item[1],
                        price: item[2],
                    })
                }

                const res = {
                    updatedAt: Date.now(),
                    prices
                };

                resolve(db.ref(DB_PRICES_PATH + `/${location_name}`).set(res));
            })
            .catch((err) => reject(err))
    })
}

// Export functions
exports.indisponibility = functions.https.onRequest((req, res) => {
    //set JSON content type and CORS headers for the response
    res.header('Content-Type', 'application/json');
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    // Grab the location name parameter.
    const location_name: Places = req.query.location;

    // Check for a correct request
    if (req.method !== 'GET' || location_name === undefined) {
        console.warn('Please send a correct request');
        res.status(400).send('Please send a correct request');
        return;
    }

    // Get database db
    db.ref(DB_DISPO_PATH + `/${location_name}/updatedAt`)
        .once('value')
        .then((snapshot) => {
            const updatedAt: number = snapshot.val();
            if (Date.now() > updatedAt + UPDATE_TIME) {
                fetchIndisponibility(location_name)
                    .then(() => sendRes())
                    .catch((err) => {
                        console.error('An error as occur : ' + err);
                        res.status(500).send('An error as occur : ' + err);
                        return;
                    });
                return;
            } else {
                sendRes();
                return;
            }
        })
        .catch((err) => {
            console.error('An error as occur : ' + err);
            res.status(500).send('An error as occur : ' + err);
            return;
        });

    function sendRes() {
        db.ref(DB_DISPO_PATH + `/${location_name}/indispos`)
            .once('value')
            .then((snapshot_) => {
                const indispos: Period[] = snapshot_.val();
                console.info('Replied : ' + indispos);
                res.status(200).send(indispos);
                return;
            })
            .catch((err) => {
                console.error('An error as occur : ' + err);
                res.status(500).send('An error as occur : ' + err);
                return;
            });
    }
});

exports.priceperiods = functions.https.onRequest((req, res) => {
    //set JSON content type and CORS headers for the response
    res.header('Content-Type', 'application/json');
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    // Grab the location name parameter.
    const location_name: Places = req.query.location;

    // Check for a correct request
    if (req.method !== 'GET' || location_name === undefined) {
        console.warn('Please send a correct request');
        res.status(400).send('Please send a correct request');
        return;
    }

    // Get database db
    db.ref(DB_PRICES_PATH + `/${location_name}/updatedAt`)
        .once('value')
        .then((snapshot) => {
            const updatedAt: number = snapshot.val();
            if (Date.now() > updatedAt + UPDATE_TIME) {
                fetchPricePeriods(location_name).then(() => sendRes()).catch();
                return;
            } else {
                sendRes();
                return;
            }
        })
        .catch((err) => {
            console.error('An error as occur : ' + err);
            res.status(500).send('An error as occur : ' + err);
            return;
        });

    function sendRes() {
        db.ref(DB_PRICES_PATH + `/${location_name}/prices`)
            .once('value')
            .then((snapshot_) => {
                const prices: PricePeriod[] = snapshot_.val();
                console.info('Replied : ' + prices);
                res.status(200).send(prices);
                return;
            })
            .catch((err) => {
                console.error('An error as occur : ' + err);
                res.status(500).send('An error as occur : ' + err);
                return;
            });
    }
});

exports.sendemail = functions.https.onRequest((req, res) => {
    //set JSON content type and CORS headers for the response
    res.header('Content-Type', 'text/plain');
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    // Check for a correct request
    if (req.method !== 'POST' || req.body === undefined) {
        console.warn('Please send a correct request');
        res.status(400).send('Please send a correct request');
        return;
    }

    // Extract data
    const data: InfoMail = JSON.parse(req.body);
    console.info(data);

    const message = {
        from: credentials.mail_user,
        to: credentials.mail_dest,
        subject: `Demande de renseignement pour ${data.place}`,
        text:
            `Vous avez reçu une demande de renseignement pour le logement ${data.place} :
- Nom : ${data.name}
- Dates : Du ${data.dates.start} au ${data.dates.end}
- Email pour répondre : ${data.senderMail}

${data.message}`
    };

    fetch(`https://recaptcha.google.com/recaptcha/api/siteverify?secret=${credentials.captcha_secret}&response=${data.captcha}`, {
        method: 'POST',
    })
        .then(result => result.json())
        .then(result =>
            new Promise((resolve, reject) => {
                    if (result.success) {
                        const transporter = nodemailer.createTransport(mailConfig);
                        resolve(transporter.sendMail(message))
                    } else {
                        reject('Captcha not verified')
                    }
                }
            ))
        .then(() => {
            console.info('Message sent');
            res.status(200).send('Message sent');
            return;
        })
        .catch((err) => {
            console.error('An error as occur : ' + err);
            res.status(500).send('An error as occur : ' + err);
            return;
        });
});
