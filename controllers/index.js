/**
 * Created by owenhong on 2015/11/10.
 */

var fs = require('fs');
var Maxim = require('maxim-workflow');
var path = require('path');
var Config = require('../config.js');
var tools = new Maxim();


exports.index = function(req,res){
    res.render('home/index',{
        title: 'owen tools',
        config:Config,
        configItemes:Config.itemsConfig
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
    var $tinyImgSwitch = req.body.tinyImgSwitch || "youtu";



    var $ftpFiles =[];
    var $errorFiles = [];
    var $errorMessage = [];
    var $successFiles = [];
    var $copyFile =[];
    var $cssFiles = [];
    var $imgFiles = [];

    //console.log('$tinyImgSwitch::::::' + $tinyImgSwitch);

    /*
     *
     * TODO 上传文件 ftpUploader
     *
     * */
    var ftpUploader = function(ftpFiles,res){
        //过滤successfiles文件路径
        var $success = [];
        $successFiles.forEach(function(data){
            var $destPathSize = data.replace(/\//g, '\\').indexOf($currentConfig.destPath);

            if($destPathSize < 0) {
                $success.push(data);
            }
        });
        var $error = [];
        $errorFiles.forEach(function(data){
            var $destPathSize = data.replace(/\//g, '\\').indexOf($currentConfig.destPath);

            if($destPathSize < 0) {
                $error.push(data);
            }
        });

        var $ftp = [];
        ftpFiles.forEach(function(data){
            var $destPathSize = data.replace(/\//g, '\\').indexOf($currentConfig.destPath+$currentConfig.destPath);



            if($destPathSize < 0) {
                $ftp.push(data);
            }
        });

        if ($ftpSwitch == "true" && ftpFiles.length > 0) {

            //console.log($ftp);

            tools.ftpUtil($ftp, $currentConfig, function (result) {
                var $ftpFiles = result.files;

                if(result.success===true){
                    $ftpFiles.forEach(function(ftpData){
                        if(ftpData.status===true){
                            $success.push(ftpData.fName);
                        }else{
                            //console.log(ftpData);
                            $error.push(ftpData.fName);
                        }
                    });

                    res.json({
                        ftpSuccess:true,
                        status: true,
                        releasePath: $currentConfig.releasePath,
                        testPath: $currentConfig.testPath,
                        destPath: $currentConfig.destPath,
                        repeatFiles : $repeatfiles,
                        repeatfilesType : $repeatfilesType,
                        errorFiles: $error,
                        successFiles: $success,
                        errorMessage:$errorMessage
                    });
                }else{
                    res.json({
                        ftpSuccess:false,
                        status: false,
                        releasePath: $currentConfig.releasePath,
                        testPath: $currentConfig.testPath,
                        destPath: $currentConfig.destPath,
                        repeatFiles : $repeatfiles,
                        repeatfilesType : $repeatfilesType,
                        errorFiles: $error,
                        successFiles: $success,
                        errorMessage:$errorMessage
                    });
                }
            });
        }else{
            res.json({
                ftpSuccess:true,
                status: true,
                releasePath: $currentConfig.releasePath,
                testPath: $currentConfig.testPath,
                destPath: $currentConfig.destPath,
                repeatFiles : $repeatfiles,
                repeatfilesType : $repeatfilesType,
                errorFiles: $error,
                successFiles: $success,
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

            //判断操作系统，linux无需替换路径“/”
            if(path.sep != "/"){
                var $localPath = result.fName.replace(/\//g,'\\');
            }else{
                var $localPath = result.fName.replace(/\//g,'\/');
            }


            if($ftpSwitch == "false" && result.status){//关闭ftp后直接输出成功压缩后的文件数组
                $successFiles.push(result.fName);
            }else if($ftpSwitch == "true" && result.status){
                $ftpFiles.push($currentConfig.destPath + $localPath);
            }else{
                $errorFiles.push(result.fName);
                $errorMessage.push(result.message);
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
        if ($tinyImgSwitch == "tinyimg") {

            console.log("tiny img::::::::::::");

            tools.tinyImg($imgFiles, $currentConfig,Config, function (result) {

                //拼接dest的路劲文件
                destPath(result);

                //ftp 上传文件
                ftpUploader($ftpFiles, res);
            });
        }else if($tinyImgSwitch == "youtu"){
            console.log("youtu:::::::::::::::");

            tools.youtu($imgFiles, $currentConfig,Config, function (result) {

                console.log(result);

                //拼接dest的路劲文件
                destPath(result);

                //ftp 上传文件
                ftpUploader($ftpFiles, res);

            });
        }
    }


    //TODO 文件分类
    for (var i in $filesType) {
        if ($filesType[i] == "text\/html" || $filesType[i] == "application\/javascript") {

            $copyFile.push($fileUrl[i]);

        } else if($filesType[i]=="text\/css"){

            $cssFiles.push($fileUrl[i]);

        }else if($filesType[i]=="image\/jpeg" || $filesType[i]=="image\/png"){

            $imgFiles.push($fileUrl[i]);
        }else{
            $copyFile.push($fileUrl[i]);
        }
    }


    //判断是否正确从配置的根元素拉取文件
    if($fileUrl[0].indexOf($currentConfig.localPath) < 0){
        res.json({
            status:false,
            errorMessage:'请上传设置的根目录下的文件！'
        });
    }else{
        //TODO 不需要处理的文件直接调用 copyFiles
        if($copyFile.length > 0){
            tools.copyFiles($copyFile,$currentConfig,function(result){
                console.log("img copy tiny::::::");

                //拼接dest的路径文件
                destPath(result);

                if($cssFiles.length <= 0 && $imgFiles.length <= 0){

                    ftpUploader($ftpFiles, res);

                }
            });
        }

        //TODO CSS处理 miniCsses
        if($cssFiles.length > 0) {
            tools.sprite($cssFiles, $currentConfig, function (result) {
                console.log("abc:::::::");
                console.log(result);
                result.forEach(function(resultFiles){
                    var $imgLocalFile = $currentConfig.destPath + resultFiles.fName.replace(/\//g,'\\');
                    var $filesname = path.basename(resultFiles.fName);
                    var $img = $filesname.split(".")[1];

                    if($img.indexOf("png") >= 0 || $img.indexOf("jpg") >= 0 ){

                        $imgFiles.push($imgLocalFile);
                    }
                });

                //拼接dest的路径文件
                destPath(result);

                if($imgFiles.length > 0){

                    //TODO tiny img
                    tinyImg();

                }else{

                    //ftp 上传文件
                    ftpUploader($ftpFiles, res);

                }
            });
        }else if($imgFiles.length > 0){

            //TODO tiny img
            tinyImg();

        }
    }
};



/*
*
* TODO 配置信息处理
*
* */

exports.addProject = function(req,res){
    var $itemsConfigSize = req.query.itemsIndex;

    res.render('home/add-project-config',{
        title: '新增项目',
        currentIndex:$itemsConfigSize,
        config:Config.itemsConfig[$itemsConfigSize],
        configItemes:Config.itemsConfig
    });
}
exports.editProject = function(req,res){
    var $itemsConfigSize = req.query.itemsIndex;

    res.render('home/edit-project-config',{
        title: '修改项目配置',
        currentIndex:$itemsConfigSize,
        config:Config.itemsConfig[$itemsConfigSize]
    });
}
exports.updateProject = function(req,res){

    var $itemsIndex = req.query.itemsIndex;

    if(Config.itemsConfig[$itemsIndex]){
        res.json({
            Config: Config.itemsConfig[$itemsIndex],
            status:true
        })
    }else{
        res.json({
            Config: Config.itemsConfig[$itemsIndex - 1],
            status:false

        })
    }
}
exports.globalSetting = function(req,res){
    res.render('home/other-config',{
        title: '全局设置',
        config:Config
    });
}



//更新css 和 sprite 版本号和状态
exports.updateCssSprite = function(req,res){
    var $itemsIndex = req.body.itemsIndex;

    var $spriteNameSwitch = req.body.spriteNameSwitch;
    var $spriteName = req.body.spriteName;

    var $cssNameSwitch = req.body.cssNameSwitch;
    var $cssName = req.body.cssName;

    var $ftpSwitch = req.body.ftpSwitch;
    var $imgSwitch = req.body.imgSwitch;


    Config.itemsConfig[$itemsIndex].ftpSwitch = $ftpSwitch;
    Config.itemsConfig[$itemsIndex].imgSwitch = $imgSwitch;

    Config.itemsConfig[$itemsIndex].spriteNameSwitch = $spriteNameSwitch;
    Config.itemsConfig[$itemsIndex].spriteName = $spriteName;

    Config.itemsConfig[$itemsIndex].cssNameSwitch = $cssNameSwitch;
    Config.itemsConfig[$itemsIndex].cssName = $cssName;



    //拼接字符串
    var configJsPath = __dirname.split('controllers')[0] + 'config.js';
    var newData = 'var Config =' + JSON.stringify(Config) + '\nmodule.exports = Config;';

    //写入文件
    fs.writeFile(configJsPath, newData, function (err) {
        if (err) {
            res.json({
                status: false,
                messages: err
            });
        }else{
            res.json(Config.itemsConfig[$itemsIndex])
        }
    });

}

//删除项目
exports.deleteProject = function(req,res){
    var $itemsIndex = req.query.itemsIndex;

    Config.itemsConfig.splice($itemsIndex,1);

    //拼接字符串
    var configJsPath = __dirname.split('controllers')[0] + 'config.js';
    var newData = 'var Config =' + JSON.stringify(Config) + '\nmodule.exports = Config;';

    //写入文件
    fs.writeFile(configJsPath, newData, function (err) {
        if (err) {
            res.json({
                status: false,
                messages: err
            });
        }else{
            res.json({
                status: true
            });
        }
    });
}


exports.doConfig = function(req,res){
    var configJsPath = __dirname.split('controllers')[0] + 'config.js';
    var $panelBox = req.body.panelBox;

    var $currentIndex = Number(req.body.currentIndex);
    var $obj = {};
    if($panelBox =="1"){
        //更新配置信息
        $obj.itemsName = req.body.itemsName;
        $obj.localPath = req.body.localPath;
        $obj.destPath = req.body.destPath || "C:\\Dest\\";
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


        console.log("test::::");
        console.log($obj);



        //判断是否是新增项目
        var $itemsConfigSize = Config.itemsConfig.length || 0;

        if($itemsConfigSize <= $currentIndex){

            //新增项目

            var $date = Math.round(new Date().getTime() / 1000);

            $obj.spriteNameSwitch = "true";
            $obj.spriteName = $date;

            $obj.cssNameSwitch = "false";
            $obj.cssName = $date;

            $obj.ftpSwitch = "true";
            $obj.imgSwitch = "youtu";

            Config.itemsConfig.push($obj);
        }else{
            //编辑项目

            Config.itemsConfig[$currentIndex].itemsName = req.body.itemsName;
            Config.itemsConfig[$currentIndex].localPath = req.body.localPath;
            Config.itemsConfig[$currentIndex].destPath = req.body.destPath || "C:\\Dest\\";
            Config.itemsConfig[$currentIndex].releasePath = req.body.releasePath;
            Config.itemsConfig[$currentIndex].testPath = req.body.testPath;
            Config.itemsConfig[$currentIndex].ftpHost = req.body.ftpHost;
            Config.itemsConfig[$currentIndex].ftpPort = req.body.ftpPort;
            Config.itemsConfig[$currentIndex].ftpRemotePath = req.body.ftpRemotePath;
            Config.itemsConfig[$currentIndex].ftpUser = req.body.ftpUser;
            Config.itemsConfig[$currentIndex].ftpPassword = req.body.ftpPassword;
        }

    }else{
        //全局设置
        Config.youtuQuality = req.body.youtuQuality || "70";
        Config.tinyApi = req.body.tinyApi;
        Config.proxy = req.body.proxy;
    }


    //拼接字符串
    var newData = 'var Config =' + JSON.stringify(Config) + '\nmodule.exports = Config;';

    //写入文件
    fs.writeFile(configJsPath, newData, function (err) {
        if (err) {
            res.json({
                status: false,
                messages: err
            });
        }else{
            res.json({
                status: true,
                messages: 'It\'s saved success !'
            });
        }
    });
}



