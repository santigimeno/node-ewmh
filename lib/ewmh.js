var EventEmitter = require('events').EventEmitter;
var util = require('util');
var os = require('os');
var x11 = require('x11');

var EWMH = function(X, root) {
    EventEmitter.call(this);
    this.X = X;
    this.root = root;
    this.X.on('event', this._handle_event.bind(this));
    X.GetWindowAttributes(root, function(err, attrs) {
        X.ChangeWindowAttributes(root, { eventMask: attrs.myEventMask | x11.eventMask.PropertyChange });
    });
};
util.inherits(EWMH, EventEmitter);

module.exports = EWMH;

EWMH.prototype.set_number_of_desktops = function(n, cb) {
    var raw = new Buffer(4);
    raw.writeUInt32LE(n, 0);
    this._change_property(this.root, '_NET_NUMBER_OF_DESKTOPS', this.X.atoms.CARDINAL, 32, raw, cb);
};

EWMH.prototype.set_current_desktop = function(d, cb) {
    var raw = new Buffer(4);
    raw.writeUInt32LE(d, 0);
    this._change_property(this.root, '_NET_CURRENT_DESKTOP', this.X.atoms.CARDINAL, 32, raw, cb);
};

EWMH.prototype.update_window_list = function(list, cb) {
    var length = list.length * 4;
    var raw = new Buffer(new Array(length));
    list.forEach(function(w, i) {
        raw.writeUInt32LE(w, i * 4);
    });

    this._change_property(this.root, '_NET_CLIENT_LIST', this.X.atoms.WINDOW, 32, raw, cb);
};

EWMH.prototype.set_pid = function(wid, cb) {
    var raw = new Buffer(4);
    raw.writeUInt32LE(process.pid);
    this.change_property(wid, '_NET_WM_PID', this.X.atoms.CARDINAL, 32, raw, cb);
};

EWMH.prototype.set_hostname = function(wid, cb) {
    var hosname = os.hostname();
    this.change_property('WM_CLIENT_MACHINE', X.atoms.STRING, 8, hostname, cb);
};

EWMH.prototype._handle_event = function(ev) {
    var self = this;
    switch(ev.name) {
        case 'PropertyNotify':
            self.X.GetAtomName(ev.atom, function(err, name) {
                if (name === '_NET_ACTIVE_WINDOW') {
                    self.X.GetProperty(0, ev.window, ev.atom, self.X.atoms.WINDOW, 0, 4, function(err, prop) {
                        self.emit('ActiveWindowChange', prop.data.readUInt32LE(0));
                    });
                }
            });
        break;
    }
}

EWMH.prototype._change_property = function(wid, property, type, units, data, cb) {
    var self = this;
    this.X.InternAtom(false, property, function(err, atom) {
        if (!err) {
            self.X.ChangeProperty(0, wid, atom, type, units, data);
        }

        if (cb) {
            cb(err);
        }
    });
};
