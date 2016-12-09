/**
 * Created by owenhong on 2015/11/10.
 */

const fs = require('fs-extra');
const path = require('path');
const request = require('request');
const os = require("os");
const osHomedir = require('os-homedir');
const Maxim = require('maxim-workflow');
const tools = new Maxim();
const Crypto = require('./crypto.js');
const Config = require('../config.js');
const MaximVersion = require('../updata/package.json');


let appDataPath = "";
if(os.platform() == "win32"){
    appDataPath = path.join(process.env.APPDATA,'Maxim');
}else if(os.platform() == "darwin"){
    appDataPath = path.join(process.env.HOME + '/Libray/Application Support','Maxim');
}

let ConfigJsonPath = path.join(appDataPath,'config.json');
if(fs.existsSync(ConfigJsonPath) === true){
    var md5ConfigJson = require(ConfigJsonPath);
    var ConfigJson = JSON.parse(Crypto.decode(md5ConfigJson.md5));
}else{
    var ConfigJson = Config;
    fs.outputFileSync(ConfigJsonPath,JSON.stringify(ConfigJson));
}

console.log(ConfigJsonPath);

exports.configData = function(req,res) {
    res.send(JSON.stringify(ConfigJson));
}


//去重复公共方法
const unique = function(array){
    const n = [];//临时数组
    array.forEach(function(data){
        if(n.indexOf(data) == -1) n.push(data);
    });
    return n;
}

//Config.js更新写入
var updataConfig = function(resSwitch,res,itemsIndex){
    //拼接字符串
    var newData = JSON.stringify(ConfigJson);
    var md5NewData = '{"md5":"' + Crypto.encode(newData) + '"}';

    //写入文件
    if(resSwitch === true) {
        fs.outputFile(ConfigJsonPath, md5NewData, function (err) {
            if (err) {
                res.json({
                    status: false,
                    messages: err
                });
            } else {
                res.json({
                    status:true,
                    Config:ConfigJson.itemsConfig[itemsIndex]
                })
            }
        });
    }else{
        fs.outputFile(ConfigJsonPath, md5NewData, function (err) {
            if (err) {
                console.log(err);
            }
        });
    }
}


exports.index = function(req,res){
    var itemsConfig = ConfigJson.itemsConfig[0] ? ConfigJson.itemsConfig : "" ;
    var DefaultPath = osHomedir() + path.sep;
    var DefaultDestPath = DefaultPath + "Dest";

    //判断monitor是否开启
    if(ConfigJson.monitor){
        //http://520ued.com/maxim/downCount
        request('http://520ued.com/maxim/downCount', function (error, response, result) {
            if (!error && response.statusCode == 200) {
                var result = JSON.parse(result);

                if(result.status){
                    ConfigJson.monitor = false;

                    updataConfig(false,res);
                }
            }else{
                res.render('home/index',{
                    title: 'Maxim',
                    config:ConfigJson,
                    DefaultPath:DefaultDestPath,
                    version:MaximVersion.version,
                    configItemes:itemsConfig
                });
            }
        });
    }

    res.render('home/index',{
        title: 'Maxim',
        config:ConfigJson,
        DefaultPath:DefaultDestPath,
        version:MaximVersion.version,
        configItemes:itemsConfig
    });
};


exports.doUploader = function(req,res){

    var $repeatfiles = req.body.filesUrl;
    var $repeatfilesType = req.body.filesType;

    var $fileUrl = req.body.filesUrl.split(',');
    var $filesType = req.body.filesType.split(',');

    var $itemsIndex = req.body.itemsIndex || 0;
    var $currentConfig = ConfigJson.itemsConfig[$itemsIndex];

    var $ftpSwitch = $currentConfig.ftpSwitch == "true" || $currentConfig.ftpSwitch == true;
    var $svnSwitch = $currentConfig.svnSwitch == "true" || $currentConfig.svnSwitch == true;
    var $httpSwitch = $currentConfig.httpSwitch == "true" || $currentConfig.httpSwitch == true;

    var $pxToRemSwitch = $currentConfig.pxToRemSwitch;

    var $errorFiles = [];
    var $svnErrorMessage = '';
    var $httpErrorMessage = [];
    var $svnCommitStatus = true;
    var $svnSuccessFiles = [];
    var $httpCommitStatus = true;
    var $httpSuccessFiles = [];
    var $errorMessage = [];
    var $successFiles = [];
    var $copyFile =[];
    var $cssFiles = [];
    var $jsFiles = [];
    var $imgFiles = [];
    var $destCssFiles = [];
    var $versionsSyncFiles = [];
    var $svnCommitFiles = [];

    /*
     *
     * TODO 上传文件 ftpUploader
     *
     * */
    var ftpUploader = function(res){
        //去除重复
        $successFiles = unique($successFiles);
        $errorFiles = unique($errorFiles);

        //过滤成功返回结果与失败返回结果中相同部分
        var $newSuccessFiles = [];
        $successFiles.forEach(function(sucValue){
            if($errorFiles.indexOf(sucValue) == -1){
                $newSuccessFiles.push(sucValue);
            }
        });
        $successFiles = $newSuccessFiles;

        var osType = os.type();
        if ($ftpSwitch && $successFiles.length > 0) {
            var $sucFtpFiles = [];
            $successFiles.forEach(function(sucPaths){
                if(os.type() == "Windows_NT"){
                    var $localPath = sucPaths.replace(/\//g,'\\');
                }else{
                    var $localPath = sucPaths;
                }
                $sucFtpFiles.push($currentConfig.destPath + $localPath);
            });

            tools.ftpUtil($sucFtpFiles, $currentConfig, function (result) {
                var $ftpFiles = result.files;

                if(result.success===true){
                    $ftpFiles.forEach(function(ftpData){
                        if(ftpData.status===true){
                            $successFiles.push(ftpData.fName);
                        }else{
                            $errorFiles.push(ftpData.fName);
                        }
                    });

                    //去除重复
                    $successFiles = unique($successFiles);
                    $errorFiles = unique($errorFiles);

                    res.json({
                        ftpSuccess:true,
                        status: true,
                        osType:osType,
                        releasePath: $currentConfig.releasePath,
                        svnSwitch: $currentConfig.svnSwitch,
                        svnErrorMessage:$svnErrorMessage,
                        svnSuccessFiles:$svnSuccessFiles,
                        svnCommitStatus:$svnCommitStatus,
                        svnReleasePath: $currentConfig.svnReleasePath,
                        httpSwitch: $currentConfig.httpSwitch,
                        httpCommitStatus:$httpCommitStatus,
                        httpSuccessFiles:$httpSuccessFiles,
                        httpReleasePath: $currentConfig.httpReleasePath,
                        httpErrorMessage: $httpErrorMessage,
                        testPath: $currentConfig.testPath,
                        httpTestPath: $currentConfig.httpTestPath,
                        destPath: $currentConfig.destPath,
                        repeatFiles : $repeatfiles,
                        repeatfilesType : $repeatfilesType,
                        versionsSyncFiles:$versionsSyncFiles,
                        svnCommitFiles:$svnCommitFiles,
                        errorFiles: $errorFiles,
                        successFiles: $successFiles,
                        errorMessage:$errorMessage
                    });
                }else{
                    $errorMessage.push('FTP链接失败，请检查FTP服务器是否能正常链接或者检查FTP配置是否正确');

                    res.json({
                        ftpSuccess:false,
                        status: false,
                        osType:osType,
                        releasePath: $currentConfig.releasePath,
                        svnSwitch: $currentConfig.svnSwitch,
                        svnErrorMessage:$svnErrorMessage,
                        svnSuccessFiles:$svnSuccessFiles,
                        svnCommitStatus:$svnCommitStatus,
                        svnReleasePath: $currentConfig.svnReleasePath,
                        httpSwitch: $currentConfig.httpSwitch,
                        httpCommitStatus:$httpCommitStatus,
                        httpSuccessFiles:$httpSuccessFiles,
                        httpReleasePath: $currentConfig.httpReleasePath,
                        httpErrorMessage: $httpErrorMessage,
                        testPath: $currentConfig.testPath,
                        httpTestPath: $currentConfig.httpTestPath,
                        destPath: $currentConfig.destPath,
                        repeatFiles : $repeatfiles,
                        repeatfilesType : $repeatfilesType,
                        versionsSyncFiles:$versionsSyncFiles,
                        svnCommitFiles:$svnCommitFiles,
                        errorFiles: $errorFiles,
                        successFiles: $successFiles,
                        errorMessage:$errorMessage
                    });
                }
            });
        }else{
            res.json({
                ftpSuccess:true,
                status: true,
                osType:osType,
                releasePath: $currentConfig.releasePath,
                svnSwitch: $currentConfig.svnSwitch,
                svnErrorMessage:$svnErrorMessage,
                svnSuccessFiles:$svnSuccessFiles,
                svnCommitStatus:$svnCommitStatus,
                svnReleasePath: $currentConfig.svnReleasePath,
                httpSwitch: $currentConfig.httpSwitch,
                httpCommitStatus:$httpCommitStatus,
                httpSuccessFiles:$httpSuccessFiles,
                httpReleasePath: $currentConfig.httpReleasePath,
                httpErrorMessage: $httpErrorMessage,
                testPath: $currentConfig.testPath,
                httpTestPath: $currentConfig.httpTestPath,
                destPath: $currentConfig.destPath,
                repeatFiles : $repeatfiles,
                repeatfilesType : $repeatfilesType,
                versionsSyncFiles:$versionsSyncFiles,
                svnCommitFiles:$svnCommitFiles,
                errorFiles: $errorFiles,
                successFiles: $successFiles,
                errorMessage:$errorMessage
            });
        }
    }

    /*
    *
    *
    * TODO 拼接 $errorFiles $successFiles 路径
    *
    *
    * */
    var destPath = function(data){
        data.forEach(function(result){
            if(result.status && result.svnSwitch){
                $svnCommitFiles.push(result.fName);
            }else if(result.status && result.versionsSyncSwitch){
                $versionsSyncFiles.push(result.fName);
            }else if(result.status){//关闭ftp后直接输出成功压缩后的文件数组
                $successFiles.push(result.fName);
            }else if(result.status == false){
                $errorFiles.push(result.fName);
                if(result.message !== undefined){
                    $errorMessage.push(result.message);
                }else{
                    $errorMessage.push(result.message);
                }
            }
        });
    }


    /*
     *
     *
     * TODO CSS 处理
     *
     *
     * */
    var cssWork = function(){
        tools.sprite($cssFiles, $currentConfig, function (result) {
            result.forEach(function(resultFiles){
                if(os.type() == "Windows_NT"){
                    var $DestFile = $currentConfig.destPath + resultFiles.fName.replace(/\//g,'\\');
                }else{
                    var $DestFile = $currentConfig.destPath + resultFiles.fName;
                }

                var $filesName = path.basename(resultFiles.fName);
                var $fileType = $filesName.split(".")[1] || '';

                var $fileTypeStatus = $fileType.indexOf("png") >= 0 || $fileType.indexOf("jpg") >= 0 || $fileType.indexOf("svg") >= 0;
                if($fileTypeStatus && resultFiles.status){
                    $imgFiles.push($DestFile);
                }else if($fileType.indexOf("css") >= 0 && resultFiles.status){
                    $destCssFiles.push($DestFile);
                }else if(resultFiles.status && $fileTypeStatus === false){
                    $copyFile.push($DestFile);
                }else if(resultFiles.status===false){
                    $errorFiles.push(resultFiles.fName);
                }
            });

            //拼接dest的路径文件
            destPath(result);

            if($imgFiles.length > 0){
                //TODO tiny img
                tinyImg();
            }else{
                //TODO px2rem
                Px2rem();
            }
        });
    }


    /*
     *
     *
     * TODO ting img
     *
     *
     * */
    var tinyImg = function() {
        //去重复
        $imgFiles = unique($imgFiles);

        if($currentConfig.imgMasterSwitch == "true" || $currentConfig.imgMasterSwitch === true) {
            //console.log("imagemin:::::::::::::::");
            tools.imagemin($imgFiles, $currentConfig, Config, function (result) {

                //拼接dest的路劲文件
                destPath(result);

                //px2rem处理
                Px2rem();
            });
        }else{
            //console.log("no image min:::::::::::::::");
            tools.copyFiles($imgFiles,$currentConfig,function(result){

                //拼接dest的路径文件
                destPath(result);

                //px2rem处理
                Px2rem();
            });
        }
    }


    /*
     *
     *
     * TODO Px2rem
     *
     *
     * */
    var Px2rem  = function(){
        if($destCssFiles.length > 0 && $pxToRemSwitch === true){
            tools.px2rem($destCssFiles,$currentConfig,function(result){
                //拼接dest的路劲文件
                destPath(result);

                //检测是否有需要JS文件需要处理
                jsMin();
            });
        }else{
            //检测是否有需要JS文件需要处理
            jsMin();
        }
    }


    /*
     *
     *
     * TODO compressJS
     *
     *
     * */
    var jsMin = function(){

        //去重复
        $jsFiles = unique($jsFiles);

        let $jsMinSwitch = $currentConfig.jsMinSwitch ? $currentConfig.jsMinSwitch:false;
        if($jsFiles.length > 0 && $jsMinSwitch){
            tools.compressJS($jsFiles,$currentConfig,function(result){

                //拼接dest的路径文件
                destPath(result);

                //检测是否有需要copy的文件
                copyFiles();

            });
        }else{
            if($jsFiles.length > 0){
                $copyFile = $copyFile.concat($jsFiles);
            }

            //检测是否有需要copy的文件
            copyFiles();
        }
    }


    /*
     *
     *
     * TODO 不需要处理的文件直接调用 copyFiles
     *
     *
     * */
    var copyFiles = function(){
        //去重复
        $copyFile = unique($copyFile);

        if($copyFile.length > 0){
            tools.copyFiles($copyFile,$currentConfig,function(result){
                console.log(result);

                //拼接dest的路径文件
                destPath(result);


                syncVersionsFiles();

            });
        }else{

            syncVersionsFiles();
        }
    }


    /*
     *
     *
     * TODO 不需要处理的文件直接调用 syncVersionsFiles
     *
     *
     * */
    var syncVersionsFiles = function(){
        //去重复
        $cssFiles = unique($cssFiles);

        if($cssFiles.length > 0 && $currentConfig.versionsSyncSwitch && $currentConfig.cssNameSwitch && $currentConfig.versionsFilePath !=""){
            tools.syncVersions($cssFiles,$currentConfig,'.ejs',function(result){

                //拼接dest的路径文件
                destPath(result);


                //svn 上传文件
                svnCommit();
            });

        }else{
            //svn 上传文件
            svnCommit();
        }
    }


    /*
     *
     *
     * TODO SVN提交
     *
     *
     * */
    var svnCommit = function(){
        //去除重复
        $successFiles = unique($successFiles);
        $errorFiles = unique($errorFiles);

        //过滤成功返回结果与失败返回结果中相同部分
        var $newSuccessFiles = [];
        $successFiles.forEach(function(sucValue){
            if($errorFiles.indexOf(sucValue) == -1){
                $newSuccessFiles.push(sucValue);
            }
        });
        $successFiles = $newSuccessFiles;

        if ($svnSwitch && $successFiles.length > 0) {
            var $sucFtpFiles = [];
            $successFiles.forEach(function (sucPaths) {
                if (os.type() == "Windows_NT") {
                    var $localPath = sucPaths.replace(/\//g, '\\');
                } else {
                    var $localPath = sucPaths;
                }
                $sucFtpFiles.push($currentConfig.destPath + $localPath);
            });

            tools.svnUtil($sucFtpFiles,$currentConfig,function (result) {
                result.forEach(function(data){
                    if(data.svnStatus){
                        $svnCommitStatus = true;
                        $svnSuccessFiles = $successFiles;
                    }else{
                        $svnCommitStatus = false;
                        $svnErrorMessage = data.message;
                    }
                });

                //http 上传文件
                httpCommit(res);
            });
        }else{
            //http 上传文件
            httpCommit(res);
        }
    }

    /*
     *
     *
     * TODO HTTP提交
     *
     *
     * */
    var httpCommit = function(){
        //去除重复
        $successFiles = unique($successFiles);
        $errorFiles = unique($errorFiles);

        //过滤成功返回结果与失败返回结果中相同部分
        var $newSuccessFiles = [];
        $successFiles.forEach(function(sucValue){
            if($errorFiles.indexOf(sucValue) == -1){
                $newSuccessFiles.push(sucValue);
            }
        });
        $successFiles = $newSuccessFiles;

        if ($httpSwitch && $successFiles.length > 0) {
            var $sucFtpFiles = [];
            $successFiles.forEach(function (sucPaths) {
                if (os.type() == "Windows_NT") {
                    var $localPath = sucPaths.replace(/\//g, '\\');
                } else {
                    var $localPath = sucPaths;
                }
                $sucFtpFiles.push($currentConfig.destPath + $localPath);
            });

            tools.httpCommit($sucFtpFiles,$currentConfig,function (result) {
                result.forEach(function(data){
                    if(data.httpStatus && data.status){
                        $httpCommitStatus = true;

                        $httpSuccessFiles.push(data.fName);

                    }else{
                        $httpCommitStatus = false;
                        $httpErrorMessage.push(data.message);
                    }
                });

                //ftp 上传文件
                ftpUploader(res);
            });

        }else{
            //ftp 上传文件
            ftpUploader(res);
        }
    }



    //TODO 文件分类
    $filesType.forEach(function(fileType,i){
        if (fileType.indexOf('javascript') != -1) {
            $jsFiles.push($fileUrl[i]);
        } else if(fileType == "text\/css"){
            $cssFiles.push($fileUrl[i]);
        }else if(fileType == "image\/jpeg" || fileType == "image\/png"){
            $imgFiles.push($fileUrl[i]);
        }else{
            $copyFile.push($fileUrl[i]);
        }
    });


    //判断是否正确从配置的根元素拉取文件
    if($fileUrl[0].indexOf($currentConfig.localPath) < 0){
        res.json({
            status:false,
            errorMessage:'请您上传此项目配置：“项目目录”下的文件！'
        });
    }else{
        var goWork = function(){
            //TODO CSS处理
            if($cssFiles.length > 0) {
                cssWork();
            }else if($imgFiles.length > 0){
                //TODO tiny img
                tinyImg();
            }else if($jsFiles.length > 0){
                //TODO jsMin
                jsMin();
            }else if($copyFile.length > 0){
                //TODO copyFiles
                copyFiles();
            }
        }

        if($currentConfig.svnSwitch === true){
            tools.svnUpdate($currentConfig,function(err,data){
                if(err){
                    res.json({
                        status:false,
                        errorMessage:'SVN Update出现错误！\n 1、请检查SVN本地目录是否出现冲突.2、检查SVN帐号密码是否填写正确'
                    });

                    return;
                }

                goWork();
            });
        }else{
            goWork();
        }
    }
}


//更新css 和 sprite 版本号和状态
exports.updateCssSprite = function(req,res){
    var $itemsIndex = req.body.itemsIndex;

    var $ftpSwitch = req.body.ftpSwitch == "on" ? true : false;

    var $svnSwitch = req.body.svnSwitch == "on" ? true : false;

    var $httpSwitch = req.body.httpSwitch == "on" ? true : false;

    var $imgMasterSwitch = req.body.imgMasterSwitch == "on" ? true : false;

    var $resourceSyncSwitch = req.body.resourceSyncSwitch == "on" ? true : false;

    var $jsMinSwitch = req.body.jsMinSwitch == "on" ? true : false;

    var $spriteNameSwitch = req.body.spriteNameSwitch == "on" ? true : false;
    var $spriteName = req.body.spriteName.trim();

    var $cssNameSwitch = req.body.cssNameSwitch == "on" ? true : false;
    var $cssName = req.body.cssName.trim();


    var $pxToRemSwitch = req.body.pxToRemSwitch == "on" ? true : false;
    var $rootValue = req.body.rootValue ? req.body.rootValue.trim() : '75';
    var $propertyBlackList = req.body.propertyBlackList ? req.body.propertyBlackList.trim() : '';


    ConfigJson.itemsConfig[$itemsIndex].ftpSwitch = $ftpSwitch;

    ConfigJson.itemsConfig[$itemsIndex].svnSwitch = $svnSwitch;

    ConfigJson.itemsConfig[$itemsIndex].httpSwitch = $httpSwitch;

    ConfigJson.itemsConfig[$itemsIndex].imgMasterSwitch = $imgMasterSwitch;

    ConfigJson.itemsConfig[$itemsIndex].resourceSyncSwitch = $resourceSyncSwitch;

    ConfigJson.itemsConfig[$itemsIndex].jsMinSwitch = $jsMinSwitch;

    ConfigJson.itemsConfig[$itemsIndex].spriteNameSwitch = $spriteNameSwitch;
    ConfigJson.itemsConfig[$itemsIndex].spriteName = $spriteName;

    ConfigJson.itemsConfig[$itemsIndex].cssNameSwitch = $cssNameSwitch;
    ConfigJson.itemsConfig[$itemsIndex].cssName = $cssName;

    ConfigJson.itemsConfig[$itemsIndex].pxToRemSwitch = $pxToRemSwitch;
    ConfigJson.itemsConfig[$itemsIndex].rootValue = $rootValue;
    ConfigJson.itemsConfig[$itemsIndex].propertyBlackList = $propertyBlackList;


    updataConfig(true,res,$itemsIndex);
}

//删除项目
exports.deleteProject = function(req,res){
    var $itemsIndex = req.query.itemsIndex;

    ConfigJson.itemsConfig.splice($itemsIndex,1);


    updataConfig(true,res,$itemsIndex);
}


//查询FTP是否为空
exports.validateFtp = function(req,res){
    var $itemsIndex = req.query.itemsIndex;
    var $currentItemes = ConfigJson.itemsConfig[$itemsIndex];

    var $null = false;
    var $switchNull = function(data){
        if(data ==""){
            $null = true;
        }
    }

    $switchNull($currentItemes.ftpHost);
    $switchNull($currentItemes.ftpPort);
    $switchNull($currentItemes.ftpRemotePath);
    $switchNull($currentItemes.ftpUser);
    $switchNull($currentItemes.ftpPassword);

    if($null === true){
        res.json({
            ftpNull:true
        });
    }else{
        res.json({
            ftpNull:false
        });
    }
}


//新增或编辑配置文件
exports.doConfig = function(req,res){

    var $panelBox = req.body.panelBox;

    var $currentIndex = Number(req.body.currentIndex);
    var DefaultDestPath = osHomedir() + path.sep + "Dest";

    var $destPathSwitch = req.body.destPathSwitch == "on" ? true : false;
    var $spriteFolderSwitch = req.body.spriteFolderSwitch == "on" ? true : false;

    var $versionsSyncSwitch = req.body.versionsSyncSwitch == "on" ? true : false;
    var $versionsFilePath = req.body.versionsFilePath ? req.body.versionsFilePath.trim() : '';

    //TODO 新增或删除配置信息
    if($panelBox =="1"){
        var $obj = {};

        //判断是否是新增项目
        var $itemsConfigSize = ConfigJson.itemsConfig.length || 0;

        if($itemsConfigSize <= $currentIndex){
            //新增项目
            var $date = Math.round(new Date().getTime() / 1000);

            $obj.itemsName = req.body.itemsName.trim();
            $obj.localPath = req.body.localPath.trim();

            $obj.releasePath = req.body.releasePath.trim();
            $obj.svnReleasePath = req.body.svnReleasePath.trim();
            $obj.testPath = req.body.testPath.trim();

            $obj.ftpHost = req.body.ftpHost.trim();
            $obj.ftpPort = req.body.ftpPort.trim();
            $obj.ftpType = req.body.ftpType || 'ftp';
            $obj.ftpRemotePath = req.body.ftpRemotePath.trim();
            $obj.ftpUser = req.body.ftpUser.trim();
            $obj.ftpPassword = req.body.ftpPassword.trim();

            $obj.svnLocalPath = req.body.svnLocalPath.trim();
            $obj.svnUser = req.body.svnUser.trim();
            $obj.svnPassword = req.body.svnPassword.trim();

            $obj.httpRemote = req.body.httpRemote.trim();
            $obj.httpTestPath = req.body.httpTestPath.trim();
            $obj.httpReleasePath = req.body.httpReleasePath.trim();
            $obj.httpToken = req.body.httpToken.trim();

            $obj.ftpSwitch = false;
            $obj.svnSwitch = false;
            $obj.httpSwitch = false;

            $obj.jsMinSwitch = false;

            $obj.imgMasterSwitch = true;
            $obj.imgSwitch = "imagemin"; //默认为本地压缩imagemin

            $obj.resourceSyncSwitch = false;

            $obj.versionsSyncSwitch = $versionsSyncSwitch;
            $obj.versionsFilePath = $versionsFilePath;

            $obj.spriteNameSwitch = true;
            $obj.spriteName = $date;

            $obj.cssNameSwitch = false;
            $obj.cssName = $date;

            $obj.destPathSwitch = $destPathSwitch;
            $obj.destPath = req.body.destPath || DefaultDestPath;

            $obj.spriteFolderSwitch = $spriteFolderSwitch;
            $obj.spriteFolderName = req.body.spriteFolderName ? req.body.spriteFolderName.trim() : "slice";

            $obj.pxToRemSwitch = false;
            $obj.rootValue = "75";
            $obj.propertyBlackList = "";


            ConfigJson.itemsConfig.push($obj);
        }else{
            //编辑项目
            ConfigJson.itemsConfig[$currentIndex].itemsName = req.body.itemsName.trim();
            ConfigJson.itemsConfig[$currentIndex].localPath = req.body.localPath.trim();

            ConfigJson.itemsConfig[$currentIndex].releasePath = req.body.releasePath.trim();
            ConfigJson.itemsConfig[$currentIndex].svnReleasePath = req.body.svnReleasePath.trim();
            ConfigJson.itemsConfig[$currentIndex].testPath = req.body.testPath.trim();


            ConfigJson.itemsConfig[$currentIndex].httpRemote = req.body.httpRemote.trim();
            ConfigJson.itemsConfig[$currentIndex].httpTestPath = req.body.httpTestPath.trim();
            ConfigJson.itemsConfig[$currentIndex].httpReleasePath = req.body.httpReleasePath.trim();
            ConfigJson.itemsConfig[$currentIndex].httpToken = req.body.httpToken.trim();

            ConfigJson.itemsConfig[$currentIndex].destPathSwitch = $destPathSwitch;
            ConfigJson.itemsConfig[$currentIndex].destPath = req.body.destPath || DefaultDestPath;

            ConfigJson.itemsConfig[$currentIndex].versionsSyncSwitch = $versionsSyncSwitch;
            ConfigJson.itemsConfig[$currentIndex].versionsFilePath = $versionsFilePath;


            ConfigJson.itemsConfig[$currentIndex].spriteFolderSwitch = $spriteFolderSwitch;
            ConfigJson.itemsConfig[$currentIndex].spriteFolderName = req.body.spriteFolderName ? req.body.spriteFolderName.trim() : "slice";

            ConfigJson.itemsConfig[$currentIndex].ftpHost = req.body.ftpHost.trim();
            ConfigJson.itemsConfig[$currentIndex].ftpPort = req.body.ftpPort.trim();
            ConfigJson.itemsConfig[$currentIndex].ftpType = req.body.ftpType || 'ftp';
            ConfigJson.itemsConfig[$currentIndex].ftpRemotePath = req.body.ftpRemotePath.trim();
            ConfigJson.itemsConfig[$currentIndex].ftpUser = req.body.ftpUser.trim();
            ConfigJson.itemsConfig[$currentIndex].ftpPassword = req.body.ftpPassword.trim();

            ConfigJson.itemsConfig[$currentIndex].svnLocalPath = req.body.svnLocalPath.trim();
            ConfigJson.itemsConfig[$currentIndex].svnUser = req.body.svnUser.trim();
            ConfigJson.itemsConfig[$currentIndex].svnPassword = req.body.svnPassword.trim();
        }
    }else{
        //全局设置
        //Config.tinyApi = req.body.tinyApi;
        //Config.proxy = req.body.proxy;
    }

    updataConfig(true,res,$currentIndex);
}



