var EWMH = function(X, root) {
    this.X = X;
    this.root = root;
};

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
