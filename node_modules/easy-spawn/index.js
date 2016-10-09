var configurable = require('config-obj');
var util = require('util');
var spawn = require('child_process').spawn;

function checkSuccess (outputData, code, errorData) {
    return code === 0 && errorData === '';
}

var Spawn = function(options) {
    var defaultOptions = {
        program: null,
        cwd: null,
        silent: false
    };

    this.option(options);
};

Spawn.joinParams =function() {
    var result = [];
    for (var i = 0; i < arguments.length; i++) {
        if (arguments[i] !== undefined && arguments[i] !== null) {
            if (util.isArray(arguments[i])) {
                result = result.concat(arguments[i]);
            }
            else {
                result.push(arguments[i]);
            }
        }
    }

    return result;
}

Spawn.prototype = {
    cmd: function(cmd, callback) {
        if (!util.isArray(cmd)) {
            cmd = [cmd];
        }

        var options = this.getOption(),
            program,
            s,
            cwd = options.cwd,
            outputData = [],
            errorData = [];

        if (typeof options.program === 'string') {
            program = options.program;
        }
        else {
            program = cmd.shift();
        }

        if (typeof cwd === 'string') {
            s = spawn(program, cmd, 
                {
                    cwd: cwd
                }
            );
        }
        else {
            s = spawn(program, cmd);
        }

        s.on('error', function(err) {
            callback && callback(err);
        });

        // Do not use "exit" event here, because "Note that the child process stdio streams might still be open."
        s.on('close', function(code, signal) {
            var check;

            if ('check' in options && typeof options.check === 'function') {
                check = options.check;
            }
            else {
                check = checkSuccess;
            }

            var outputDataString = outputData.join('');
            var errorDataString = errorData.join('');
            // success
            if (check(outputDataString, code, errorDataString)) {
                callback && callback(null, outputDataString);
            }
            else {
                var e = new Error(errorDataString);
                e.code = code;
                e.output = outputDataString;
                callback && callback(e);
            }
        });
        // s.on('exit', function(code, signal) {

        // });
        // s.on('disconnect', function() {

        // });
        // s.on('message', function() {

        // });
        s.stdout.on('data', function(data) {
            if (!options.silent) {
                process.stdout.write(data);
            }
            outputData.push(data);
        });
        s.stderr.on('data', function(data) {
            if (!options.silent) {
                process.stderr.write(data);
            }
            errorData.push(data);
        });

        this.endSession();
        return this;
    }
};

configurable(Spawn);

module.exports = Spawn;