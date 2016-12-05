/**
 * files : 待压缩的js文件列表
 * config : 配置文件数据
 * callback : 回调数据
 * */
"use strict";
//var LintStream = require('jslint').LintStream;
var uglifyJS = require('uglify-js');
var fs = require('fs');
var path = require('path');
var async = require('async');
var common = require('./common');

class JSCompressor{
    constructor (files,config,callback){
        //判断files是数组还是字符串
        this.files = files;
        this.config = config;
        this.callback = callback;
    }
    /**
     *ops : 压缩选项，作为后续压缩js外部配置的预留接口
     * */
    compress(ops){
        var _this = this;
        //文件处理结果集
        let rets = [];
        //验证文件列表中文件是否存在
        let files = [];
        //任务函数列表
        let funcs = [];
        _this.files.forEach(function (file) {
            try{
                if(fs.statSync(file).isFile()){
                    //文件存在压入文件队列
                    files.push(file);
                    funcs.push(_this._compressJS(file,_this.config));
                }else{
                    rets.push({
                        fName : file.replace(_this.config.localPath,'').replace(/\\/g,'\/'),
                        status : false,
                        message : '文件不存在'
                    });
                }
            }catch(e){
                rets.push({
                    fName : file.replace(_this.config.localPath,'').replace(/\\/g,'\/'),
                    status : false,
                    message : e.message
                });
            }
        });
        //异步处理js文件
        async.parallel(funcs,function (err,results) {
            if(err){
                console.log(err.message);
            }else{
                _this.callback(results);
            }
        });

    }
    /**
     * file : js文件路径
     * config ：配置文件
     * rets ：结果数组
     * */
    _compressJS(file,config){
        return function (cb) {
            function _compress() {

                //处理文件链场景
                var sourceFilePath = file;
                if (path.extname(file).indexOf('js') != -1) {
                    var lstatSync = fs.lstatSync(file);
                    var isSymbolicLink = lstatSync.isSymbolicLink();
                    if(isSymbolicLink){
                        sourceFilePath = fs.realpathSync(file);
                    }
                }

                //压缩文件
                let result = null;
                try{
                    result = uglifyJS.minify(sourceFilePath, {
                        compress: {
                            sequences     : true,  // join consecutive statemets with the “comma operator”
                            properties    : true,  // optimize property access: a["foo"] → a.foo
                            dead_code     : true,  // discard unreachable code
                            drop_debugger : true,  // discard “debugger” statements
                            unsafe        : false, // some unsafe optimizations (see below)
                            conditionals  : true,  // optimize if-s and conditional expressions
                            comparisons   : true,  // optimize comparisons
                            evaluate      : true,  // evaluate constant expressions
                            booleans      : true,  // optimize boolean expressions
                            loops         : true,  // optimize loops
                            unused        : true,  // drop unused variables/functions
                            hoist_funs    : true,  // hoist function declarations
                            hoist_vars    : false, // hoist variable declarations
                            if_return     : true,  // optimize if-s followed by return/continue
                            join_vars     : true,  // join var declarations
                            cascade       : true,  // try to cascade `right` into `left` in sequences
                            side_effects  : true,  // drop side-effect-free statements
                            warnings      : true,  // warn about potentially dangerous optimizations/code
                            drop_console  : true   //drop console code
                        },
                        mangle : {
                            except : ['require','module','exports']
                        }
                    });
                }catch (e){
                    cb(null,{
                        fName : file.replace(config.localPath,'').replace(/\\/g,'\/'),
                        status : false,
                        message : e.message
                    });
                    return;
                }

                //目标文件路径
                let targetFile = file.replace(config.localPath,config.destPath);
                let targetDir = path.dirname(targetFile);

                common.createPath(targetDir,fs);
                //写文件
                try{
                    fs.writeFile(targetFile,result.code,function (err) {
                        if(err){
                            cb(null,{
                                fName : file.replace(config.localPath,'').replace(/\\/g,'\/'),
                                status : false,
                                message : err.message
                            });
                        }else{
                            cb(null,{
                                fName : file.replace(config.localPath,'').replace(/\\/g,'\/'),
                                status : true
                            });
                        }
                    });
                }catch(e){
                    cb(null,{
                        fName : file.replace(config.localPath,'').replace(/\\/g,'\/'),
                        status : false,
                        message : e.message
                    });
                }
            }
            _compress();
        };
    }
    /**
     * js文件校验功能函数
     *
     * */
    /*
    lintJS(file,lintCallback,options){
        //文件校验
        var options = {
            "edition": "latest",
            "length": 100
        }, linter = new LintStream(options);
        var fileContent = fs.readFileSync(file,{
            encoding : 'utf-8'
        });
        linter.write({
            file: '',
            body: fileContent
        });

        linter.on('data', function (chunk, encoding, callback) {
            // chunk.linted is an object holding the result from running JSLint
            // chunk.linted.ok is the boolean return code from JSLINT()
            // chunk.linted.errors is the array of errors, etc.
            // see JSLINT for the complete contents of the object
            console.log(chunk.linted.errors);
        });
    }
    */
}

module.exports = JSCompressor;