
var fse = require('fs-extra');
var path = require('path');

function Copyfile(){}
Copyfile.prototype = {
    copyFile : function(files,Config,callback){
        var results = [];
        var index = files.length;

        files.forEach(function(file){
            //处理config中路径的配置如果不以\结尾，则要加上
            Config.destPath = Config.destPath[Config.destPath.length-1] === path.sep ? Config.destPath : Config.destPath + path.sep;

            var relativeFile = file.replace(Config.destPath, '').replace(Config.localPath, '');
            var destPath = path.join(Config.destPath,relativeFile);

            fse.copy(file, destPath, function (err) {
                var $destPathName = destPath.replace(Config.destPath, '').replace(Config.localPath, '').replace(/\\/g, '\/');

                if (err) {
                    try {
                        if (err.message.indexOf('Source and destination must not be the same') < 0) {
                            results.push({
                                status: false,
                                fName: $destPathName,
                                message: err.message
                            });

                            index--;
                            if (index <= 0) {
                                callback(results);
                            }
                        }else{
                            //当复制文件与dest文件是同一个时返回正确结果到前台
                            results.push({
                                status: true,
                                fName: $destPathName,
                            });

                            index--;
                            if (index <= 0) {
                                callback(results);
                            }
                        }
                    }catch(e){
                        //err.message有可能是数组，这样err.message.indexOf就会报错
                        results.push({
                            status:false,
                            fName:$destPathName,
                            message: e.message
                        });

                        index--;
                        if(index <= 0){
                            callback(results);
                        }
                    }
                    return;
                }

                results.push({
                    status:true,
                    fName:$destPathName
                });
                index--;
                if(index <= 0){
                    callback(results);
                }
            });
        });
    }
};
module.exports = Copyfile;