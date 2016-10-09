/**
 * Created by owenhong on 2016/8/8.
 */

'use strict';

var os = require("os");
var path = require("path");
var Client = require('svn-spawn');
var fse = require('fs-extra');




function svn(){}

svn.prototype.update = function(Config,callback){
    var client = new Client({
        cwd: Config.svnLocalPath,
        username: Config.svnUser, // optional if authentication not required or is already saved
        password: Config.svnPassword, // optional if authentication not required or is already saved
        noAuthCache: true, // optional, if true, username does not become the logged in user on the machine
    });

    client.update(function(err, data) {
        callback(err,data);
    });
}

svn.prototype.init = function(files,Config,callback){
    var client = new Client({
        cwd: Config.svnLocalPath,
        username: Config.svnUser, // optional if authentication not required or is already saved
        password: Config.svnPassword, // optional if authentication not required or is already saved
        noAuthCache: true, // optional, if true, username does not become the logged in user on the machine
    });
    var results = [];
    client.update(function(err, data) {
        if (err) {
            console.log('update error...');
            console.log(err);

            results.push({
                svnStatus: false,
                status: false,
                message: err.message
            });
            callback(results);
            return;
        }
        client.cmd(['add',Config.svnLocalPath,'--force'] , function (err, data) {
            if (err) {
                console.log('addLocal error....')
                results.push({
                    svnStatus: false,
                    status: false,
                    message: err.message
                });
                callback(results);
                return;
            }

            client.commit('Maxim commit', function(err, data) {
                if (err) {
                    console.log('commit error....')
                    if(err.message.indexOf('E155015') >= 0) {

                        console.log('E155015...');

                        let length = files.length;
                        let index = length;

                        files.forEach(function (filePath) {
                            fse.remove(filePath, function (err) {
                                if (err) {
                                    index--;
                                    if (index <= 0) {
                                        results.push({
                                            svnStatus: true,
                                            status: false,
                                            message: err.message
                                        });
                                        callback(results);
                                    }
                                }

                                index--;
                                if (index <= 0) {
                                    client.update(function(err, data) {
                                        if (err) {
                                            console.log('update SVN...');
                                            results.push({
                                                svnStatus: true,
                                                status: false,
                                                message: err.message
                                            });
                                            callback(results);
                                        }
                                        results.push({
                                            svnStatus: true,
                                            status: false,
                                            message: "SVN文件提交时出现冲突"
                                        });
                                        callback(results);
                                    });
                                }
                            });
                        });
                    }else{
                        console.log('No E155015...');
                        var errorMessage = err.message;
                        if(err.message.indexOf('spawn svn ENOENT') >= 0) {
                            errorMessage = "SVN找不到命令行,请确认cmd是否能执行svn命令,如果执行不了SVN命令，请重新安装SVN"
                        }

                        results.push({
                            svnStatus: true,
                            status: false,
                            message: errorMessage
                        });

                        callback(results);
                    }
                }else{
                    console.log('svn goods.....');
                    results.push({
                        svnStatus: true,
                        status: true,
                        message: 'svn commit success...'
                    });

                    callback(results);
                }
            });
        });
    });
}


module.exports = svn;