var proto = {
    getOption: function(key, defaultValue) {
        init(this);
        // get all
        if (arguments.length === 0) {
            return mergeOptions({}, this._options, this._sessionOptions);
        }

        if (key in this._sessionOptions) {
            return this._sessionOptions[key];
        }
        if (key in this._options) {
            return this._options[key];
        }

        return defaultValue;
    },
    option: function() {
        var options;
        init(this);
        if (arguments.length > 1) {
            options = {};
            options[arguments[0]] = arguments[1]
        }
        else {
            options = arguments[0];
        }

        mergeOptions(this._options, options);

        return this;
    },
    session: function() {
        var options;
        init(this);
        if (arguments.length > 1) {
            options = {};
            options[arguments[0]] = arguments[1]
        }
        else {
            options = arguments[0];
        }

        mergeOptions(this._sessionOptions, options);
        return this;
    },
    endSession: function() {
        this._sessionOptions = {};
        return this;
    }
};

function init(that) {
    if (that._options === undefined) {
        that._options = {};
        that._sessionOptions = {};
    }
}

function mergeOptions (base) {
    var options = base,
        k;

    for (var i = 1; i < arguments.length; i++ ) {
        if (arguments[i] !== undefined && arguments[i] !== null) {
            for (var k in arguments[i]) {
                options[k] = arguments[i][k];
            }
        }
    }

    return options;
}

module.exports = function(target) {
    if (typeof target === 'function') {
        mergeOptions(target.prototype, proto);
    }
    else {
        mergeOptions(target, proto);
    }
};