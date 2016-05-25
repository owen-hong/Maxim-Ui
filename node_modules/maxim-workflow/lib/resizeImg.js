/**
 * 作者：chaoluo
 * 时间：2016-4-25
 * 说明：图片转成指定倍率，比如图片缩小一半
 * */
"use strict";
var fs = require('fs');
var path = require('path');
var images = require('images');
var common = require('./common.js');
class ResizeImg {
    //图片变形类的构造函数
    constructor(files,config,callback){
        //返回的结果集
        this.rets = [];
        this.files = files;
        this.config = config;
        this.callback = callback;
    }
    //图片默认缩小一半
    resize(ratio){
        let r = ratio || 0.5;
        //过滤图片并处理图片
        this.filterFile(this.files , r , this.chargeFile);
    }
    //图片文件过滤：图片是否是@2x，图片是否存在
    filterFile(files,ratio,cb){
        let imgs = [],
            count = files.length,
            index = count,
            pArr = [];
        //如果出入空数组，则直接返回空数组
        if(count <= 0){
            return imgs;
        }
        //循环文件数组，对文件进行过滤
        for(let i = 0 ; i < count ; i++){
            //对于2倍图的文件使用异步判断的形式来提升整个功能的效率
            if(/@2x\.png$/.test(files[i]) === true){
                let p = new Promise((resolve,reject) => {
                    //判断文件是否存在
                    fs.stat(files[i],(err,stats) => {
                        /**
                         * !!!这里一定要注意，如果使用reject的话，整个promise的后续承诺都会失效
                         */
                        if(err){
                            reject({
                                fileName : files[i],
                                status : false,
                                message : '文件不存在'
                            });
                        }else{
                            resolve({
                                fileName: files[i],
                                status: true
                            });
                        }
                    });
                }).then((result) => {
                        imgs.push(result.fileName);
                },(result) => {
                        this.rets.push(result);
                    });
                pArr.push(p);
            }else{
                //非2倍图
                this.rets.push({
                    fileName : files[i],
                    status : false,
                    message : '非2倍图'
                });
            }
        }

        var pAll = Promise.all(pArr);
        pAll.then((rets) => {
            cb(imgs,ratio,this);
        },(errs) => {
            console.log('line ' ,errs);
        });
    }
    //图片改变尺寸，_this将实例传递进回调函数
    chargeFile(files,ratio,_this){
        let count = files.length;
        for(let i = 0 ; i < count ; i++){
            //将图片缩小
            let img = images(files[i]);
            let size = img.size();

            console.log(path.dirname(files[i]));

            //目标文件目录
            let destPath = _this.config.destPath === undefined || _this.config.destPath === '' ? path.dirname(files[i]) : _this.config.destPath;

            console.log(destPath);

            //如果目录不存在则创建该目录
            common.createPath(destPath,fs);

            //将2倍图的名称转换成1倍图的名称
            let fname = path.basename(files[i]).replace('@2x.png','.png');

            console.log(destPath + common.getCurrentPlat().split + fname);

            //图片缩小到指定的倍率，1/2
            img.size(size.width * ratio)
                .save(destPath + common.getCurrentPlat().split + fname);
            _this.rets.push({
                fileName : files[i],
                status : true
            });
        }
        _this.callback(_this.rets);
    }
}

module.exports = ResizeImg;