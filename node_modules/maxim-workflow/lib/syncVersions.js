/**
 * Created by owenhong on 2016/8/12.
 */

'use strict';
var fse = require('fs-extra');
var path = require('path');

function syncVersions(){}
syncVersions.prototype.init = function(filePath,CurrentConfig,fileType,callback){
    var versions =  CurrentConfig.cssName ? CurrentConfig.cssName : '';
    fileType =  fileType ? fileType : '.ejs';

    var RegExVersions = /{{\s*Maxim-verisons\s*}}/ig;


    var index = filePath.length;
    var results = [];

    filePath.forEach(function(cssFile) {
        var baseName = path.basename(cssFile,'.css');
        var devName = baseName + '-dev' + fileType;
        var destPath = CurrentConfig.versionsFilePath;
        var devFile = path.join(destPath, baseName + '-dev' + fileType);
        var destFile = path.join(destPath, baseName + fileType);


        fse.stat(devFile,function(err,stat){
            if(stat && stat.isFile()) {
                fse.readFile(devFile, function (error, fileData) {
                    if (error) {
                        results.push({
                            versionsSyncSwitch:true,
                            fName: destFile,
                            status: false,
                            message: error.message
                        });

                        index--;
                        if (index <= 0) {
                            callback(results);
                        }
                    }

                    var $data = fileData.toString();
                    var result = $data.replace(RegExVersions, versions);

                    fse.writeFile(destFile, result, function (err) {
                        if (err) {
                            results.push({
                                versionsSyncSwitch:true,
                                fName: destFile,
                                status: false,
                                message: err.message
                            });

                            index--;
                            if (index <= 0) {
                                callback(results);
                            }
                        }

                        results.push({
                            versionsSyncSwitch:true,
                            fName: destFile,
                            status: true
                        });


                        index--;
                        if (index <= 0) {
                            callback(results);
                        }

                    })
                });
            }else{
                results.push({
                    versionsSyncSwitch:true,
                    fName: devFile,
                    status: false,
                    message: '未找css到对应的ejs版本文件'
                });

                index--;
                if (index <= 0) {
                    callback(results);
                }
            }
        });

    });
}

module.exports = syncVersions;