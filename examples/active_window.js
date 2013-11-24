var x11 = require('x11');
var ewmh_mod = require('../lib/ewmh');

x11.createClient(function(err, display) {
    if (err) {
        throw err;
    }

    ewmh_mod.createEWMH(display.client, display.screen[0].root, function(err, ewmh) {
        if (err) {
            throw err;
        }

        ewmh.on('ActiveWindow', function(wid) {
            console.log('new active window:', wid);
        });
    });
});
