/**
 * Created by owenhong on 2016/2/3.
 */

var Imagemin = require('imagemin');
var imageminPngquant = require('imagemin-pngquant');

new Imagemin()
    .src(['images/1.png','images/1.jpg'])
    .dest('images/build')
    .use(imageminPngquant({quality: '65-85', speed: 4}))
    .use(Imagemin.jpegtran({progressive: true}))
    .use(Imagemin.svgo())
    .use(Imagemin.gifsicle({interlaced: true}))
    .run(function(err,files){
        console.log(files[0]);
    });
