"use strict";
function Maxim(){}
Maxim.prototype = {
    copyFiles : function(files,config,callback){
        //只做文件在本地目录上的迁移和拷贝，这里是将指定源目录下的文件拷贝到指定的目标目录下
        var mover = require('./lib/mover.js');
        //拷贝文件
        new mover().copyFile(files,config,callback);
    },
    sprite : function (imgs,config,callback) {
        /*
        //对指定的样式文件进行雪碧图合并
        var spriter = require('./lib/sprite.js');
        new spriter().sprite(imgs,config,callback);
        */
        this.spriteMediaQuery(imgs,config,callback);
    },
    spriteMediaQuery : function (imgs,config,callback){
        //将样式进行合并处理，合并雪碧图，按照media query来进行划分
        var spriteMedias = require('./lib/spriteMedias');
        new spriteMedias().go(imgs,config,callback);
    },
    miniCsses : function(csses,config,callback){
        //调用lib的自定义库
        var min = require('./lib/mincss.js');
        new min().minCsses(csses,config,callback);
    },
    ftpUtil : function(files,Config,callback){
        var ftpUtil = require('./lib/ftpUtil.js');
        new ftpUtil().ftp(files,Config,callback);
    },
    svnUtil : function(files,Config,callback){
        var svnUtil = require('./lib/svn.js');
        new svnUtil().init(files,Config,callback);
    },
    svnUpdate : function(Config,callback){
        var svnUtil = require('./lib/svn.js');
        new svnUtil().update(Config,callback);
    },
    syncVersions : function(files,Config,fileType,callback){
        var syncVersions = require('./lib/syncVersions.js');
        new syncVersions().init(files,Config,fileType,callback);
    },
    imagemin:function(imgs,Config,globalConfig,callback){
        var imagemin = require('./lib/imagemin.js');
        new imagemin().compressor(imgs,Config,globalConfig,callback);
    },
    px2rem:function(files,Config,callback){
        var Px2rem = require('./lib/px2rem.js');
        Px2rem(files,Config,callback);
    },
    //config.dest
    //halfImg : function(imgs,config,callback){
    //    var resizer = require('./lib/resizeImg.js');
    //    new resizer(imgs,config,callback).resize();
    //},
    //JS压缩
    compressJS : function (files,config,callback) {
        var Compressor = require('./lib/jsCompressor');
        var compressor = new Compressor(files,config,callback);
        compressor.compress();
    },
    //http上传
    httpCommit : function (files,config,callback) {
        var httpCommit = require('./lib/httpCommit');
        new httpCommit().fileUpload(files,config,callback);
    },
    //http上传
    svgChangeSize : function (files,config,callback) {
        var modifySvg = require('./lib/modify-svg');
        modifySvg.changeSize(files, config ,callback);
    },
    //http上传
    svg2png : function (file,config,callback) {
        var svgToPng = require('./lib/svg2png');
        new svgToPng().svg2png(file, config ,callback);
    }
};


module.exports = Maxim;