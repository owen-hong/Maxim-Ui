var Spawn = require('../');

var spawn = new Spawn({
    cwd: __dirname + '/src',
});

module.exports = {
    'test ls': function(test) {
        spawn.cmd('ls', function(err, data) {
            test.equals(err, null);
            test.equals(data.indexOf('a.txt'), 0);
            test.done();
        });
    },
    'test ls -l': function(test) {
        spawn.cmd(['ls', '-l'], function(err, data) {
            test.equals(err, null);
            test.done();
        });
    },
    'test git': function(test) {
        spawn.option({
            program: 'git'
        });
        spawn.cmd('--version', function(err, data) {
            test.equals(err, null);
            test.equals(data.indexOf('git version'), 0);
            test.done();
        });
    },
    // 'test error': function(test) {
    //     spawn.session({
    //         silent: true,
    //         program: 'none_exist_command',
    //     }).cmd('-h', function(err, data) {
    //         test.ok(err instanceof Error);
    //         test.done();
    //     });
    // }
};