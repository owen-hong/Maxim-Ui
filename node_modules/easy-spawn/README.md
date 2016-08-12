# easy-spawn

Utilities that make it easier to write child_process.spawn programmes.

## Features

- Easy to use
- Standard callback with `err` and `data`

## Usage

Below are some examples of how to work with `easy-spawn`, you can find more examples under the `/test/` directory

### Get file list with `ls`

```js
var Spawn = require('easy-spawn');

spawn = new Spawn({
    cwd: '/working directory where you want to ran command',
});

spawn.cmd('ls', function(err, data) {
   console.log(data); 
});

spawn.cmd(['ls', '-l', '/var/log'], function(err, data) {
    console.log(data);
});
```

### Get your git version

```js
var Spawn = require('easy-spawn');

spawn = new Spawn();
spawn.cmd(['git', '--version'], function(err, data) {
   console.log(data); // git version 1.7.xxx 
});
```

## Installation

```bash
npm install easy-spawn
```