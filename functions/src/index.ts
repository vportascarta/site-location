const functions = require('firebase-functions');
const admin = require('firebase-admin');
const {OAuth2Client} = require('google-auth-library');
const {google} = require('googleapis');
const nodemailer = require('nodemailer');
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
    Tignes = "tignes",
    Faro = "faro"
}

interface InfoMail {
    name: string,
    senderMail: string,
    place: Places,
    dates: Period
    message: string
}

// Init App & Auth
admin.initializeApp(functions.config().firebase);
const db = admin.database();
const functionsOauthClient = new OAuth2Client(credentials.client_id, credentials.secret, credentials.redirect_url);
let oauthTokens = null;
const DB_TOKEN_PATH = '/api_tokens';
const DB_DISPO_PATH = '/dispo';
const DB_PRICES_PATH = '/prices';

// Visit the URL for this Function to request tokens
exports.authgoogleapi = functions.https.onRequest((req, res) => {
    res.set('Cache-Control', 'private, max-age=0, s-maxage=0');
    res.redirect(functionsOauthClient.generateAuthUrl({
        access_type: 'offline',
        scope: credentials.scopes,
        prompt: 'consent',
    }));
});

// After you grant access, you will be redirected to the URL for this Function
// this Function stores the tokens to your Firebase database
exports.oauthcallback = functions.https.onRequest((req, res) => {
    res.set('Cache-Control', 'private, max-age=0, s-maxage=0');
    const code = req.query.code;
    functionsOauthClient.getToken(code, (err, tokens) => {
        // Now tokens contains an access_token and an optional refresh_token. Save them.
        if (err) {
            return res.status(400).send(err);
        }
        return admin.database().ref(DB_TOKEN_PATH).set(tokens)
            .then(() => {
                return res.status(200).send('App successfully configured with new Credentials. '
                    + 'You can now close this page.');
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
        return getAuthorizedClient().then((auth) => {
            const calendar = google.calendar({version: 'v3', auth});
            return calendar.events.list(config, (err, response) => {
                if (err) {
                    console.log(`The API returned an error: ${err}`);
                    reject(err);
                }
                resolve(response.data.items);
            });
        });
    });
}

function readDataFromSheet(sheet_name: string) {
    const config = {
        spreadsheetId: credentials.sheet_id,
        range: sheet_name + '!A2:C100',
        majorDimension: 'ROWS',
    };

    return new Promise((resolve, reject) => {
        return getAuthorizedClient().then((auth) => {
            const sheets = google.sheets({version: 'v4', auth});
            return sheets.spreadsheets.values.get(config, (err, response) => {
                if (err) {
                    console.log(`The API returned an error: ${err}`);
                    reject(err);
                }
                resolve(response.data.values);
            });
        });
    });
}

function fetchIndisponibility(location_name: Places): Promise<void> {
    return readDataFromCalandar().then((data: [any]) => {
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

        return db.ref(DB_DISPO_PATH + `/${location_name}`).set(res);
    });
}

function fetchPricePeriods(location_name: string): Promise<void> {
    return readDataFromSheet(location_name).then((data: [any]) => {
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

        return db.ref(DB_PRICES_PATH + `/${location_name}`).set(res);
    });
}

// Export functions
exports.indisponibility = functions.https.onRequest((req, res) => {
    // Grab the location name parameter.
    const location_name: Places = req.query.location;

    // Check for a correct request
    if (req.method !== "GET" || location_name === undefined) {
        res.status(400).send('Please send a correct request');
    }

    // Get database db
    db.ref(DB_DISPO_PATH + `/${location_name}/updatedAt`)
        .once('value')
        .then((snapshot) => {
            const updatedAt: number = snapshot.val();
            if (Date.now() > updatedAt + 24 * 60 * 60 * 1000) {
                fetchIndisponibility(location_name).then(() => sendRes()).catch()
            } else {
                sendRes()
            }
        });

    function sendRes() {
        db.ref(DB_DISPO_PATH + `/${location_name}/indispos`)
            .once('value')
            .then((snapshot_) => {
                const indispos: Period[] = snapshot_.val();
                res.status(200).send(indispos);
            })
            .catch(() => res.status(400).send("Error"))
    }
});

exports.pricePeriods = functions.https.onRequest((req, res) => {
    // Grab the location name parameter.
    const location_name: Places = req.query.location;

    // Check for a correct request
    if (req.method !== "GET" || location_name === undefined) {
        res.status(400).send('Please send a correct request');
    }

    // Get database db
    db.ref(DB_PRICES_PATH + `/${location_name}/updatedAt`)
        .once('value')
        .then((snapshot) => {
            const updatedAt: number = snapshot.val();
            if (Date.now() > updatedAt + 24 * 60 * 60 * 1000) {
                fetchPricePeriods(location_name).then(() => sendRes()).catch()
            } else {
                sendRes()
            }
        });

    function sendRes() {
        db.ref(DB_PRICES_PATH + `/${location_name}/prices`)
            .once('value')
            .then((snapshot_) => {
                const prices: PricePeriod[] = snapshot_.val();
                res.status(200).send(prices);
            })
            .catch(() => res.status(400).send("Error"))
    }
});

/*
exports.sendEmail = functions.https.onRequest((req, res) => {
    // Check for POST request
    if (req.method !== "POST") {
        res.status(400).send('Please send a POST request');
        
    }

    const poolConfig = {
        pool: true,
        host: 'smtp.orange.fr',
        port: 465,
        secure: true, // use TLS
        auth: {
            user: 'username',
            pass: 'password'
        }
    };

    // Extract data
    const data: InfoMail = req.body

});
*/