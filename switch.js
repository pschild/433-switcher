const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const basicAuth = require('express-basic-auth');
const fs = require('fs');
const http = require('http');
const https = require('https');

const privateKey = fs.readFileSync('../../dehydrated/certs/pschild.duckdns.org/privkey.pem', 'utf8');
const certificate = fs.readFileSync('../../dehydrated/certs/pschild.duckdns.org/fullchain.pem', 'utf8');
const credentials = {key: privateKey, cert: certificate};

const app = express();
app.use(basicAuth({
    users: { 'admin': 'supersecret' }
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));

const rpi433 = require('rpi-433');

/*
rfSniffer = rpi433.sniffer({
    pin: 2,
    debounceDelay: 500
});
rfSniffer.on('data', (data) => {
    console.log('received', data.code, data.pulseLength);
});
*/

rfEmitter = rpi433.emitter({
    pin: 0,
    pulseLength: 350
});

app.get('/switch/:code', function (req, res) {
    /*
    A: 1361 = on, 1364 = off
    B: 4433 = on, 4436 = off
    C: 5201 = on, 5204 = off
    */
    let code = +req.params.code;
    console.log(code);
    rfEmitter.sendCode(code)
        .then((stdout) => {
            res.json({
                'success': true,
                'result': stdout
            });
        }, (error) => {
            console.log('Error', error);
        });
});

app.post('/alexa', function (req, res) {
    let {switchNameSlot, switchActionSlot} = req.body.payload;

    let spokenNameValue = switchNameSlot.value;
    let mappedNameFromSynonym = switchNameSlot.resolutions.resolutionsPerAuthority[0].values[0].value.name;

    let spokenActionValue = switchActionSlot.value;
    let mappedActionFromSynonym = switchActionSlot.resolutions.resolutionsPerAuthority[0].values[0].value.name;

    console.log(mappedNameFromSynonym, mappedActionFromSynonym);

    let code;
    switch (mappedNameFromSynonym) {
        case 'Fernseher':
            code = mappedActionFromSynonym === 'ein' ? 1361 : 1364;
            break;
        case 'Test':
            code = mappedActionFromSynonym === 'ein' ? 4433 : 4436;
            break;
        case 'Anlage':
            code = mappedActionFromSynonym === 'ein' ? 5201 : 5204;
            break;
    }

    rfEmitter.sendCode(code)
        .then((stdout) => {
            res.json({
                'success': true,
                'result': stdout
            });
        }, (error) => {
            console.log('Error', error);
        });
});

let httpServer = http.createServer(app);
let httpsServer = https.createServer(credentials, app);

httpServer.listen(3000, () => console.log('HTTP app listening on port 3000!'));
httpsServer.listen(3443, () => console.log('HTTPS app listening on port 3443!'));
