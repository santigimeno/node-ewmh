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

        ewmh.on('CurrentDesktop', function(c) {
            console.log('Request to change current desktop to: ' + c);
        });

        ewmh.set_number_of_desktops(4, function(err) {
            if (err) {
                throw err;
            }

            ewmh.set_current_desktop(1);
        });
    });
});
