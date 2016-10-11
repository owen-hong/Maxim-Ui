/**
 * Created by owenhong on 2016/7/29.
 */
var gui = require('nw.gui');
var path = require('path');
var fse = require('fs-extra');
var pkg = require('./updata/package.json'); // Insert your app's manifest here
var updater = require('node-webkit-updater');
var upd = new updater(pkg);


// Args passed when new app is launched from temp dir during update
// ------------- Step 1 -------------
var checkMaximUpdada = function(){
    upd.checkNewVersion(function(error, newVersionExists, manifest) {
        if(error){
            console.log(error);
        }

        //TODO 显示更新 dialog
        var showUpdataDialog = function(){
            var $cancel  = document.querySelector("#updataNo");
            var $ok  = document.querySelector("#updataYes");
            var $version  = document.querySelector("#updataText .version");
            var $modalDialog  = document.querySelector("#updataDialog");
            var $modalContent  = document.querySelector(".modal-content");
            var $updataInfo  = document.querySelector(".modal-dialog .logs");


            //显示弹框
            $modalDialog.style.display = 'block';

            //输出更新信息
            $updataInfo.innerText = manifest.updataInfo;
            $version.innerHTML = manifest.version;

            //计算高度，使其居中
            var $marginTop = $modalContent.offsetHeight/2;
            $modalContent.style.marginTop = -$marginTop + 'px';


            $ok.onclick = function(){
                gui.App.quit();
            }
            $cancel.onclick = function(){
                $modalDialog.style.display = 'none';
            }
        }

        //是否需要更新
        if(newVersionExists){
            var isMac = (navigator.platform == "Mac68K") || (navigator.platform == "MacPPC") || (navigator.platform == "Macintosh") || (navigator.platform == "MacIntel");

            if (!error){
                // ------------- Step 2 -------------
                upd.download(function(error, filename) {
                    console.log("download...");

                    if (!error) {
                        // ------------- Step 3 -------------
                        upd.unpack(filename, function(error, newAppPath) {
                            if(error){
                                alert("更新失败,请下次重启软件时再更新!");
                            }

                            //解压完后删除更新包
                            fse.remove(filename, function(err){
                                if (err) return console.error(err);

                                console.log('解压完后删除更新包 success!');
                            });

                            if (!error) {
                                //console.log("runInstaller...");
                                var $dirPath = path.dirname(newAppPath);
                                var $getAppPath = process.cwd(); //upd.getAppPath()由于此接口在osx10.10.5下面返回路径不对，所以暂时弃用


                                var $core = manifest.core || false;
                                if($core && isMac === false){

                                    upd.runInstaller(newAppPath, [$getAppPath, $dirPath],{});

                                }else if($core === false){
                                    //partial renewal
                                    fse.copy($dirPath, $getAppPath, function (err) {
                                        if (err) {
                                            console.log(err);
                                            return false;
                                        }

                                        //更新成功文件后删除临时目
                                        fse.remove($dirPath, function (err) {
                                            if (err){
                                                console.log('更新失败，请稍后重试!');
                                            }

                                            setTimeout(function() {
                                                console.log('更新成功,请重启软件!');
                                                showUpdataDialog();
                                            },800);
                                        });
                                    });
                                }
                            }else{
                                console.log('更新失败，请下次重启软件时再更新!');
                            }
                        }, manifest);
                    }
                }, manifest);

            }else{
                console.log("更新失败,请下次重启软件是再更新!");
            }
        }else{
            console.log('暂无更新');
        }
    });
}


//页面初始化的时候检查更新
setTimeout(function() {
    checkMaximUpdada();
},1000);

var checkUpdataTime = function(){
    var today = new Date();
    var h = today.getHours();
    var m = today.getMinutes();
    var currentTime = h + ":" + m;

    if(currentTime == '10:30' || currentTime == '13:30' || currentTime == '15:30' || currentTime == '16:30' || currentTime == '17:30' || currentTime == '19:30' ){
        checkMaximUpdada();
    }
}

//每隔一分钟检查服务器是否需要更新
setInterval(function() {
    checkUpdataTime();
},60000);



