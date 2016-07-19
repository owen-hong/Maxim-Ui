/**
 * Created by owenhong on 2015/11/10.
 */

var fs = require('fs');
var path = require('path');
var request = require('request');
var os = require("os");
var osHomedir = require('os-homedir');
var Config = require('../config.js');
var Maxim = require('maxim-workflow');
var tools = new Maxim();
var MaximVersion = require('../updata/package.json');




exports.configData = function(req,res) {
    res.send(JSON.stringify(Config));
}


//去重复公共方法
var unique = function(array){
    var n = [];//临时数组
    array.forEach(function(data){
        if(n.indexOf(data) == -1) n.push(data);
    });
    return n;
}

//Config.js更新写入
var updataConfig = function(resSwitch,res,itemsIndex){
    //拼接字符串
    var configJsPath = __dirname.split('controllers')[0] + 'config.js';
    var newData = 'var Config =' + JSON.stringify(Config) + '\nmodule.exports = Config;';

    //写入文件
    if(resSwitch === true) {
        fs.writeFile(configJsPath, newData, function (err) {
            if (err) {
                res.json({
                    status: false,
                    messages: err
                });
            } else {
                res.json({
                    status:true,
                    Config:Config.itemsConfig[itemsIndex]
                })
            }
        });
    }else{
        fs.writeFile(configJsPath, newData, function (err) {
            if (err) {
                console.log(err);
            }
        });
    }
}


exports.index = function(req,res){

    var itemsConfig = Config.itemsConfig[0] ? Config.itemsConfig : "" ;
    var DefaultPath = osHomedir() + path.sep;
    var DefaultDestPath = DefaultPath + "Dest";


    //判断monitor是否开启
    if(Config.monitor){
        //http://520ued.com/maxim/downCount
        request('http://520ued.com/maxim/downCount', function (error, response, result) {
            if (!error && response.statusCode == 200) {
                var result = JSON.parse(result);

                if(result.status){
                    Config.monitor = false;

                    updataConfig(false,res);
                }
            }else{
                res.render('home/index',{
                    title: 'owen tools',
                    config:Config,
                    DefaultPath:DefaultDestPath,
                    configItemes:itemsConfig
                });
            }
        });
    }

    res.render('home/index',{
        title: 'owen tools',
        config:Config,
        DefaultPath:DefaultDestPath,
        configItemes:itemsConfig
    });
};

exports.doUploader = function(req,res){

    var $repeatfiles = req.body.filesUrl;
    var $repeatfilesType = req.body.filesType;

    var $fileUrl = req.body.filesUrl.split(',');
    var $filesType = req.body.filesType.split(',');

    var $itemsIndex = req.body.itemsIndex || 0;
    var $currentConfig = Config.itemsConfig[$itemsIndex];

    var $ftpSwitch = req.body.ftpSwitch;
    var $tinyImgSwitch = "imagemin"; //req.body.tinyImgSwitch || "imagemin";

    var $pxToRemSwitch = req.body.pxToRemSwitch;

    var $errorFiles = [];
    var $errorMessage = [];
    var $successFiles = [];
    var $copyFile =[];
    var $cssFiles = [];
    var $jsFiles = [];
    var $imgFiles = [];
    var $destCssFiles = [];

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
        if ($ftpSwitch == "true" && $successFiles.length > 0) {

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
                        testPath: $currentConfig.testPath,
                        destPath: $currentConfig.destPath,
                        repeatFiles : $repeatfiles,
                        repeatfilesType : $repeatfilesType,
                        errorFiles: $errorFiles,
                        successFiles: $successFiles,
                        errorMessage:$errorMessage
                    });
                }else{
                    res.json({
                        ftpSuccess:false,
                        status: false,
                        osType:osType,
                        releasePath: $currentConfig.releasePath,
                        testPath: $currentConfig.testPath,
                        destPath: $currentConfig.destPath,
                        repeatFiles : $repeatfiles,
                        repeatfilesType : $repeatfilesType,
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
                testPath: $currentConfig.testPath,
                destPath: $currentConfig.destPath,
                repeatFiles : $repeatfiles,
                repeatfilesType : $repeatfilesType,
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

            if(result.status){//关闭ftp后直接输出成功压缩后的文件数组
                $successFiles.push(result.fName);
            }else{
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
     * TODO ting img
     *
     *
     * */
    var tinyImg = function() {
        //去重复
        $imgFiles = unique($imgFiles);

        //console.log($imgFiles);

        if(Config.itemsConfig[$itemsIndex].imgMasterSwitch == "true") {

            switch($tinyImgSwitch)
            {
                case "tinyimg":
                    //console.log("tiny img::::::::::::");
                    tools.tinyImg($imgFiles, $currentConfig, Config, function (result) {
                        //拼接dest的路劲文件
                        destPath(result);

                        //px2rem处理
                        Px2rem();
                    });
                    break;
                case "youtu":
                    //console.log("youtu:::::::::::::::");
                    tools.youtu($imgFiles, $currentConfig, Config, function (result) {

                        //拼接dest的路劲文件
                        destPath(result);

                        //px2rem处理
                        Px2rem();
                    });
                    break;
                default:
                    //console.log("imagemin:::::::::::::::");
                    tools.imagemin($imgFiles, $currentConfig, Config, function (result) {

                        //拼接dest的路劲文件
                        destPath(result);

                        //px2rem处理
                        Px2rem();
                    });
            }

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
        if($destCssFiles.length > 0 && $pxToRemSwitch == "true"){
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

        if($jsFiles.length > 0){
            tools.compressJS($jsFiles,$currentConfig,function(result){
                //拼接dest的路径文件
                destPath(result);

                //检测是否有需要copy的文件
                copyFiles();

            });
        }else{

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
                //拼接dest的路径文件
                destPath(result);


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
        if (fileType == "application\/javascript") {
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
        //TODO CSS处理 miniCsses
        if($cssFiles.length > 0) {
            tools.sprite($cssFiles, $currentConfig, function (result) {

                result.forEach(function(resultFiles){
                    if(os.type() == "Windows_NT"){
                        var $DestFile = $currentConfig.destPath + resultFiles.fName.replace(/\//g,'\\');
                    }else{
                        var $DestFile = $currentConfig.destPath + resultFiles.fName;
                    }

                    var $filesName = path.basename(resultFiles.fName);
                    var $fileType = $filesName.split(".")[1] || '';

                    var $fileTypeStatus = $fileType.indexOf("png") >= 0 || $fileType.indexOf("jpg") >= 0;
                    if($fileTypeStatus && resultFiles.status){
                        $imgFiles.push($DestFile);
                    }else if($fileType.indexOf("css") >= 0 && resultFiles.status){
                        $destCssFiles.push($DestFile);
                    }else if(resultFiles.status){
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
}



/*
*
* TODO 配置信息处理
*
* */

exports.addProject = function(req,res){
    var $itemsConfigSize = req.query.itemsIndex;
    var DefaultPath = osHomedir() + path.sep;
    var DefaultDestPath = DefaultPath + "Dest";


    res.render('home/add-project-config',{
        title: '新增项目',
        currentIndex:$itemsConfigSize,
        config:Config.itemsConfig[$itemsConfigSize],
        configItemes:Config.itemsConfig,
        DefaultPath:DefaultPath,
        DefaultDestPath:DefaultDestPath
    });
}
exports.editProject = function(req,res){
    var $itemsConfigSize = req.query.itemsIndex;
    var $tabIndex = req.query.tabIndex || 0;
    var DefaultDestPath = osHomedir() + path.sep + "Dest";

    res.render('home/edit-project-config',{
        title: '修改项目配置',
        currentIndex:$itemsConfigSize,
        config:Config.itemsConfig[$itemsConfigSize],
        tabIndex:$tabIndex,
        DefaultDestPath:DefaultDestPath
    });
}
exports.updateProject = function(req,res){
    var $itemsIndex = req.query.itemsIndex || 0;

    if(Config.itemsConfig[$itemsIndex]){
        res.json({
            Config: Config.itemsConfig[$itemsIndex],
            status:true,
            itemsLength:Config.itemsConfig.length
        })
    }else{
        res.json({
            Config: Config.itemsConfig[$itemsIndex - 1],
            status:false,
            itemsLength:Config.itemsConfig.length
        })
    }
}
exports.globalSetting = function(req,res){
    res.render('home/global-config',{
        title: '全局设置',
        config:Config,
        version:MaximVersion.version
    });
}



//更新css 和 sprite 版本号和状态
exports.updateCssSprite = function(req,res){
    var $itemsIndex = req.body.itemsIndex;

    var $ftpSwitch = req.body.ftpSwitch == "on" ? "true" : "false";

    var $imgMasterSwitch = req.body.imgMasterSwitch == "on" ? "true" : "false";
    var $imgSwitch = req.body.imgSwitch;

    var $spriteNameSwitch = req.body.spriteNameSwitch == "on" ? "true" : "false";
    var $spriteName = req.body.spriteName;

    var $cssNameSwitch = req.body.cssNameSwitch == "on" ? "true" : "false";
    var $cssName = req.body.cssName;


    //var $imgSyncSwitch = req.body.imgSyncSwitch == "on" ? "true" : "false";
    //var $imgSyncName = req.body.imgSyncName;

    var $resourceSyncSwitch = req.body.resourceSyncSwitch == "on" ? "true" : "false";

    var $pxToRemSwitch = req.body.pxToRemSwitch == "on" ? "true" : "false";
    var $rootValue = req.body.rootValue ? req.body.rootValue : Config.itemsConfig[$itemsIndex].rootValue;
    var $propertyBlackList = req.body.propertyBlackList ? req.body.propertyBlackList : Config.itemsConfig[$itemsIndex].propertyBlackList;


    Config.itemsConfig[$itemsIndex].ftpSwitch = $ftpSwitch;

    Config.itemsConfig[$itemsIndex].imgMasterSwitch = $imgMasterSwitch;
    Config.itemsConfig[$itemsIndex].imgSwitch = $imgSwitch;

    Config.itemsConfig[$itemsIndex].spriteNameSwitch = $spriteNameSwitch;
    Config.itemsConfig[$itemsIndex].spriteName = $spriteName;

    Config.itemsConfig[$itemsIndex].cssNameSwitch = $cssNameSwitch;
    Config.itemsConfig[$itemsIndex].cssName = $cssName;

    //Config.itemsConfig[$itemsIndex].imgSyncSwitch = $imgSyncSwitch;
    //Config.itemsConfig[$itemsIndex].imgSyncName = $imgSyncName;

    Config.itemsConfig[$itemsIndex].resourceSyncSwitch = $resourceSyncSwitch;

    Config.itemsConfig[$itemsIndex].pxToRemSwitch = $pxToRemSwitch;
    Config.itemsConfig[$itemsIndex].rootValue = $rootValue;
    Config.itemsConfig[$itemsIndex].propertyBlackList = $propertyBlackList;


    updataConfig(true,res,$itemsIndex);
}

//删除项目
exports.deleteProject = function(req,res){
    var $itemsIndex = req.query.itemsIndex;

    Config.itemsConfig.splice($itemsIndex,1);


    updataConfig(true,res,$itemsIndex);
}


//查询FTP是否为空
exports.validateFtp = function(req,res){
    var $itemsIndex = req.query.itemsIndex;
    var $currentItemes = Config.itemsConfig[$itemsIndex];

    var $null = false;
    var $switchNull = function(data){
        if(data ==""){
            $null = true;
        }
    }

    $switchNull($currentItemes.ftpHost);
    $switchNull($currentItemes.ftpPort);
    $switchNull($currentItemes.ftpRemotePath);
    $switchNull($currentItemes.testPath);
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
    var configJsPath = __dirname.split('controllers')[0] + 'config.js';
    var $panelBox = req.body.panelBox;

    var $currentIndex = Number(req.body.currentIndex);
    var DefaultDestPath = osHomedir() + path.sep + "Dest";


    var $obj = {};
    if($panelBox =="1"){
        //更新配置信息

        $obj.itemsName = req.body.itemsName;
        $obj.localPath = req.body.localPath;
        $obj.destPath = req.body.destPath || DefaultDestPath;

        $obj.releasePath = req.body.releasePath;
        $obj.testPath = req.body.testPath;

        $obj.ftpHost = req.body.ftpHost;
        $obj.ftpPort = req.body.ftpPort;
        $obj.ftpRemotePath = req.body.ftpRemotePath;
        $obj.ftpUser = req.body.ftpUser;
        $obj.ftpPassword = req.body.ftpPassword;

        $obj.spriteNameSwitch = req.body.spriteNameSwitch;
        $obj.spriteName = req.body.spriteName  || "";
        $obj.cssNameSwitch = req.body.cssNameSwitch;
        $obj.cssName = req.body.cssName  || "";

        $obj.spriteFolderSwitch = req.body.spriteFolderSwitch == "on" ? "true" : "false";
        $obj.spriteFolderName = req.body.spriteFolderName  || "slice";

        $obj.pxToRemSwitch = "false";
        $obj.rootValue = "75";
        $obj.propertyBlackList = "";

        //判断是否是新增项目
        var $itemsConfigSize = Config.itemsConfig.length || 0;


        if($itemsConfigSize <= $currentIndex){

            //新增项目
            var $date = Math.round(new Date().getTime() / 1000);

            $obj.spriteNameSwitch = "true";
            $obj.spriteName = $date;

            $obj.cssNameSwitch = "false";
            $obj.cssName = $date;

            //$obj.imgSyncSwitch = "false";
            //$obj.imgSyncName = $date;

            $obj.ftpSwitch = "false";

            $obj.imgMasterSwitch = "true";
            $obj.imgSwitch = "imagemin"; //默认为本地压缩imagemin

            Config.itemsConfig.push($obj);
        }else{
            //编辑项目
            Config.itemsConfig[$currentIndex].itemsName = req.body.itemsName;
            Config.itemsConfig[$currentIndex].localPath = req.body.localPath;

            Config.itemsConfig[$currentIndex].destPath = req.body.destPath || DefaultDestPath;
            Config.itemsConfig[$currentIndex].releasePath = req.body.releasePath;
            Config.itemsConfig[$currentIndex].testPath = req.body.testPath;

            Config.itemsConfig[$currentIndex].spriteFolderSwitch = req.body.spriteFolderSwitch == "on" ? "true" : "false";
            Config.itemsConfig[$currentIndex].spriteFolderName = req.body.spriteFolderName;

            Config.itemsConfig[$currentIndex].ftpHost = req.body.ftpHost;
            Config.itemsConfig[$currentIndex].ftpPort = req.body.ftpPort;
            Config.itemsConfig[$currentIndex].ftpRemotePath = req.body.ftpRemotePath;
            Config.itemsConfig[$currentIndex].ftpUser = req.body.ftpUser;
            Config.itemsConfig[$currentIndex].ftpPassword = req.body.ftpPassword;
        }

    }else{
        //全局设置
        //Config.youtuQuality = req.body.youtuQuality || "85";
        Config.tinyApi = req.body.tinyApi;
        Config.proxy = req.body.proxy;
    }

    updataConfig(true,res,$currentIndex);
}



