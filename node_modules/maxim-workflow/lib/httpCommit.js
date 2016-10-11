"use strict";

/**
 * Created by andypliang on 2016/9/20.
 */
var fs = require('fs');
var path_mod = require('path');
var request = require('request');


function file() {}

file.prototype.fileUpload = function(files, Config, callback){
    var index = files.length,
        results = [];
    try {
        if(!Config.httpRemote) {
            results.push({
                httpStatus: false,
                message: "上传请求地址为空"
            });
            callback(results);
        } else if(!Config.httpReleasePath || Config.httpReleasePath.indexOf("/data/release/") !== 0) {
            //如果提单路径为空或者提单路径不是以/data/ftp/开头的话，都报错
            var msg = "请检查您的提单路径，HTTP提单路径应该以/data/release/开头";
            if(!Config.httpReleasePath) {
                msg = "HTTP提单路径为空,不能进行HTTP文件上传";
            }
            results.push({
                httpStatus: false,
                message: msg
            });
            callback(results);
        } else {
            files.forEach(function(path) {
                var
                    rootPath = Config.localPath;
                // 相对路径
                var
                    releatedPath = path.replace(Config.destPath, '').replace(rootPath,'').replace('\\\\','\\').replace(path_mod.basename(path),'');
                // 表单数据
                var
                    formData = {
                        releasePath: Config.httpReleasePath,
                        releatedPath: releatedPath,
                        file: fs.createReadStream(path)
                    };

                // 上传文件
                request.post({
                    url: Config.httpRemote,
                    formData: formData
                }, function optionalCallback(err, httpResponse, body) {
                    if (err) {
                        results.push({
                            httpStatus: true,
                            fName: path.replace(Config.destPath, '').replace(rootPath, '').replace(/\\/g, '\/'),
                            status: false,
                            message: err.message
                        });
                        console.error('upload failed:', err);
                    } else if(httpResponse.statusCode === 200) {
                        results.push({
                            httpStatus: true,
                            fName: path.replace(Config.destPath, '').replace(rootPath, '').replace(/\\/g, '\/'),
                            status: true,
                            message: "文件上传成功"
                        });
                        console.log('Upload successful!  Server responded with:', body);
                    } else {
                        // 状态码不是200的都需要检查url
                        index = 0;
                        results.push({
                            httpStatus: true,
                            status: false,
                            message: "HTTP上传失败,请检查上传url"
                        });
                    }
                    if (--index <= 0) {
                        callback(results);
                    }
                });
            });
        }
    } catch (e) {
        results.push({
            httpStatus: false,
            message: e
        });
        callback(results);
    }
}

module.exports = file;


