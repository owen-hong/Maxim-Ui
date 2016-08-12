# node-config-obj

Make object or class configurable.

## Usage

```js
var configurable = require('config-obj');

var MyClass = function() {
    
};

MyClass.prototype.mainJob = function() {
    // do something

    // call the endSession method so that you can use session style configuration
    this.endSession(); 
}

configurable(MyClass);

var myInstance = new MyClass();
myInstance.option({
    option1: 'option1',
    option2: 'option2',
    //... 
});
myInstance.getOption('option1');

myInstance.session('option1', 'this value will only be applied only once').mainJob();
```

## Installation

Install it via npm:

```bash
npm install config-obj
```