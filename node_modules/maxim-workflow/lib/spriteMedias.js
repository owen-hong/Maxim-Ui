/**
 * Created by chaoluo on 2016/6/3.
 */
"use strict";
var async = require('async');
var media = require('./spriteMedia');
class Maxim{
    constructor () {

    }
    go(cssFiles,config,callback){
        let len = cssFiles.length;
        let funcs = [];
        for(let i = 0 ; i < len ; i++){
            let m = new media(cssFiles[i],config,null);
            funcs.push(function (cb) {
                return m.init(cb);
            });
        }
        //并行处理没有给样式文件的任务
        async.parallel(funcs, (err, results) => {
            //将每个样式文件的结果集进行合并
            let rets = [];
            let len = results.length;
            for(let i = 0 ; i < len ; i++){
                let count = results[i].length;
                for(let j = 0 ; j < count ; j++){
                    rets.push(results[i][j]);
                }
            }
            //返回数据
            callback(rets);
        });
    }
}
module.exports = Maxim;