var EventEmitter = require('events').EventEmitter;
var util = require('util');
var os = require('os');
var async = require('async');
var encoder = require('x11-prop').encoder;

var EWMH = function(X, root) {
    EventEmitter.call(this);
    var self = this;
    this.X = X;
    this.root = root;
    this.X.on('event', this._handle_event.bind(this));
    this.X.GrabServer();
    X.GetWindowAttributes(root, function(err, attrs) {
        if (!(attrs.myEventMask & X.eventMask.SubstructureRedirect)) {
            X.ChangeWindowAttributes(root,
                                     { eventMask: attrs.myEventMask | X.eventMask.SubstructureRedirect },
                                     function(err) {
                var error = new Error('Could not set SubstructureRedirect to root window event_mask');
                error.x11_error = err;
                self.emit('error', error);
                return true;
            });

            self.X.UngrabServer();
        }
    });
};
util.inherits(EWMH, EventEmitter);

module.exports = EWMH;

EWMH.prototype.set_supported = function(list, cb) {
    var self = this;
    async.map(
        list,
        function(prop, cb) {
            self.X.InternAtom(false, prop, cb);
        },
        function(err, results) {
            if (err) {
                if (cb) {
                    cb(err);
                }

                return;
            }

            var data = encoder.encode('ATOM', results);
            self._change_property(self.root, '_NET_SUPPORTED', self.X.atoms.ATOM, 32, data, cb);
        }
    );
};

EWMH.prototype.set_number_of_desktops = function(n, cb) {
    var data = encoder.encode('CARDINAL', [ n ]);
    this._change_property(this.root, '_NET_NUMBER_OF_DESKTOPS', this.X.atoms.CARDINAL, 32, data, cb);
};

EWMH.prototype.set_current_desktop = function(d, cb) {
    var data = encoder.encode('CARDINAL', [ d ]);
    this._change_property(this.root, '_NET_CURRENT_DESKTOP', this.X.atoms.CARDINAL, 32, data, cb);
};

EWMH.prototype.update_window_list = function(list, cb) {
    var data = encoder.encode('WINDOW', list);
    this._change_property(this.root, '_NET_CLIENT_LIST', this.X.atoms.WINDOW, 32, data, cb);
};

EWMH.prototype.set_pid = function(wid, cb) {
    var data = encoder.encode('CARDINAL', [ process.pid ]);
    this._change_property(wid, '_NET_WM_PID', this.X.atoms.CARDINAL, 32, data, cb);
};

EWMH.prototype.set_hostname = function(wid, cb) {
    var data = encoder.encode('STRING', [ os.hostname() ]);
    var hostname = os.hostname();
    this._change_property(wid, 'WM_CLIENT_MACHINE', this.X.atoms.STRING, 8, data, cb);
};

EWMH.prototype.set_active_window = function(wid, cb) {
    var data = encoder.encode('WINDOW', [ wid ]);
    this._change_property(this.root, '_NET_ACTIVE_WINDOW', this.X.atoms.WINDOW, 32, data, cb);
};

EWMH.set_composite_manager_owner = function(wid, screenNo, cb) {
    var self = this;
    this.X.InternAtom(false, '_NET_WM_CM_S' + screenNo, function(err, composite_atom) {
        if (err) return cb(err);
        self.X.SetSelectionOwner(wid, composite_atom, cb);
    });
};

EWMH.prototype._handle_event = function(ev) {
    var self = this;
    switch(ev.name) {
        case 'ClientMessage':
            this.X.GetAtomName(ev.type, function(err, name) {
                switch (name) {
                    case '_NET_ACTIVE_WINDOW':
                        self.emit('ActiveWindow', ev.wid);
                    break;

                    case '_NET_CURRENT_DESKTOP':
                        self.emit('CurrentDesktop', ev.data[0]);
                    break;
                }
            });
        break;
    }
};

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
