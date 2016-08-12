var configurable = require('../');

var Counter = function(options) {
    this.total = 0;
    this.option(options);
};

Counter.prototype.inc = function() {
    this.total += this.getOption('step', 1);
    this.endSession();
};

function testCommon(obj, test) {
    obj.option({
        'a': 1,
        'b': 2
    });

    test.equal(obj.getOption('a'), 1);
    test.equal(obj.getOption('b'), 2);
    test.equal(obj.getOption('nonexist'), undefined);
    test.equal(obj.getOption('nonexist', 'default'), 'default');

    obj.session('c', 3);
    test.equal(obj.getOption('c'), 3);
    obj.endSession();
    test.equal(obj.getOption('c'), undefined);
}

module.exports = {
    'test object': function(test) {
        var obj = {};
        configurable(obj);

        testCommon(obj, test);
        
        test.done();
    },
    'test class': function(test) {
        configurable(Counter);
        var obj = new Counter();

        testCommon(obj, test);

        obj.option()

        test.equal(obj.total, 0);
        obj.inc();

        test.equal(obj.total, 1);

        obj.session('step', -2).inc();


        test.equal(obj.total, -1);

        obj.inc();

        test.equal(obj.total, 0);

        test.done();
    }
};
