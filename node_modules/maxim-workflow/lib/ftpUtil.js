var path = require('path');
var async = require('async');
var Client = require('ftp');
var SftpClient = require('ssh2').Client;
var common = require('./common.js');

var ftpConnection = {
    ftp : new Client(),
    sftp : new SftpClient()
};
//ftp上传的常量
const FTPType = {
    ftp : 'ftp',
    sftp : 'sftp'
};



function ftpUtil(){}
ftpUtil.prototype = {
    switch:true,
    ftp : function(files,Config,callback){
        var self = this;

        Config.ftpType =  Config.ftpType ? Config.ftpType : 'ftp';


        //默认为ftp上传方式，如果设置为sftp的话则进行重新赋值
        var Connection = ftpConnection[Config.ftpType || 'ftp'];

        console.log('ftp start.......');

        //连接ftp服务器
        Connection.connect({
            host: Config.ftpHost,
            user: Config.ftpUser ,
            password: Config.ftpPassword,
            port: Config.ftpPort
        });

        //ftp链接出错
        Connection.on('error',function(e){
            console.log('error....');
            //ftp或sftp链接失败
            callback({
                success:false,
                files:[{
                    fName:'none',
                    status:false,
                    message:e.message
                }]
            });
        });


        //连接成功
        Connection.on('ready',function(){
            console.log('ready.......');
            if(self.switch){
                self.switch = false;
                if(Config.ftpType === FTPType.ftp){
                    self.filesCheck(this,files,Config,callback)
                }else{
                    Connection.sftp(function (err,sftp) {
                        self.filesCheck(sftp,files,Config,callback);
                    });
                }
            }
        });

    },
    filesCheck : function (Connection,files,Config,callback){
        //处理传入文件为空的情况
        var _files = files || [];
        if(_files.length < 1){
            var err= {
                success:false,
                files:[{
                    fName:'none',
                    status:false,
                    message:'您没有要上传的文件！'
                }]
            };
            if(Config.ftpType === FTPType.ftp){
                Connection.end();
            }else{
                ftpConnection.sftp.end();
            }
            callback(err);
            return;
        }

        //处理路径模块
        //var plat = common.getCurrentPlat();
        var split = path.sep;
        //处理config中路径的配置如果不以\结尾，则要加上
        Config.destPath = Config.destPath[Config.destPath.length-1] === split ? Config.destPath : Config.destPath + split;

        //处理远端目录是否有/
        if(Config.ftpRemotePath[Config.ftpRemotePath.length - 1] != '/'){
            Config.ftpRemotePath = Config.ftpRemotePath + '/'
        }

        this.upload(Connection,_files,Config,callback);
    },
    /**
     * 上传指定目录下的指定文件
     * @c ：ftp连接实例
     * @fPath ：远程的文件目录
     * @_files ：待上传的文件数组
     * @Config ：配置文件读取的配置细腻
     * @cb ：传入的回调函数
     * */
    upload: function(Connection,_files,Config,cb){
        var self = this;
        //去除根目录
        var filePath = _files[0].replace(Config.destPath,'');
        //取出一个文件名
        var fileName = path.basename(filePath);
        //获取文件目录
        var mkPaths,
            filePaths;

        //如果直接传根目录下的文件，打flag，否则分析目录结构
        if(filePath == fileName){
            filePaths = [];
        }else{
            mkPaths = path.dirname(filePath);
            //获取目录数组
            filePaths = mkPaths.split(path.sep);
        }

        //判断是否需要创建目录
        if(filePaths.length > 0){
            //顺序创建目录，创建完成后上传目录下的文件
            let createDirTasks = [],
                tmpPath = Config.ftpRemotePath,
                craeteDirTaskCount = true;
            for(let i = 0 ; i < filePaths.length ; i++){
                tmpPath += filePaths[i] + '/';
                let taskItem = (function (rPath) {
                    if(craeteDirTaskCount){
                        craeteDirTaskCount = false;
                        return function (dirCallback) {
                            Connection.mkdir(rPath,true,function (err) {
                                if(err){
                                    dirCallback(null,err);
                                }else{
                                    console.log(tmpPath + ' 创建成功');
                                    dirCallback(null,{
                                        status : true
                                    });
                                }
                            });
                        }
                    }else{
                        return function (preResult,dirCallback) {
                            Connection.mkdir(rPath,true,function (err) {
                                if(err){
                                    dirCallback(null,err);
                                }else{
                                    console.log(tmpPath + ' 创建成功2');
                                    dirCallback(null,{
                                        status : true
                                    });
                                }
                            });
                        }
                    }
                })(tmpPath);
                createDirTasks.push(taskItem);
            }
            //顺序创建远程目录
            async.waterfall(createDirTasks,function (err,result) {
                uploadFiles(Config.ftpRemotePath,_files,cb);
            });
        }else{
            //上传文件
            uploadFiles(Config.ftpRemotePath,_files,cb);
        }
        function uploadFiles(remotePath,files,callback) {
            let ftpTasks = [];
            for(let i = 0 ; i < files.length ; i++){
                let p = new Promise(function (resolve,reject) {
                    if(typeof Connection.put === 'function'){
                        Connection.put(files[i],remotePath + files[i].replace(Config.destPath,'').replace(/\\/g,'\/'),function (err) {
                            if(err){
                                resolve({
                                    status : false,
                                    fName : files[i].replace(Config.destPath,'').replace(/\\/g,'\/'),
                                    message : err.message
                                });
                            }else{
                                resolve({
                                    status : true,
                                    fName : files[i].replace(Config.destPath,'').replace(/\\/g,'\/')
                                });
                            }
                        });
                    }else if(typeof Connection.fastPut === 'function'){
                        console.log(remotePath + files[i].replace(Config.destPath,'').replace(/\\/g,'\/'));
                        Connection.fastPut(files[i],remotePath + files[i].replace(Config.destPath,'').replace(/\\/g,'\/'),function (err) {
                            if(err){
                                resolve({
                                    status : false,
                                    fName : files[i].replace(Config.destPath,'').replace(/\\/g,'\/'),
                                    message : err.message
                                });
                            }else{
                                resolve({
                                    status : true,
                                    fName : files[i].replace(Config.destPath,'').replace(/\\/g,'\/')
                                });
                            }
                        });
                    }
                });
                ftpTasks.push(p);
            }
            //执行所有的文件上传
            Promise.all(ftpTasks)
                .then(function (result) {
                    if(Config.ftpType == 'ftp'){
                        console.log('ftp end...');
                        Connection.end();
                    }else{

                        console.log('sftp end...');
                        ftpConnection.sftp.end();
                    }
                    self.switch = false;
                    callback({
                        success : true,
                        files : result
                    });
                });
        }
    }
};
module.exports = ftpUtil;