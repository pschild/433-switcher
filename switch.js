const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
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
    let code = +req.params.code; // 4433 = on, 4436 = off for Switch "B"
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

app.listen(8080, () => {
    console.log('Server is running on Port 8080');
});