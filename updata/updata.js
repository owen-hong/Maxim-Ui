/**
 * Created by Owen on 16/2/9.
 */
/*
 1. Check the manifest for version (from your running "old" app).
 2. If the version is different from the running one, download new package to a temp directory.
 3. Unpack the package in temp.
 4. Run new app from temp and kill the old one (i.e. still all from the running app).
 5. The new app (in temp) will copy itself to the original folder, overwriting the old app.
 6. The new app will run itself from original folder and exit the process.
 */

var gui = require('nw.gui');
var path = require('path');
var fse = require('fs-extra');
var pkg = require('./updata/package.json'); // Insert your app's manifest here
var updater = require('node-webkit-updater');
var upd = new updater(pkg);

// Args passed when new app is launched from temp dir during update
// ------------- Step 1 -------------
upd.checkNewVersion(function(error, newVersionExists, manifest) {
    if(error){
        window.location = 'http://localhost:3030';
    }

    //是否需要更新
    if(newVersionExists){
        var $version  = document.querySelector("#updataText .version");
        var $modalDialog  = document.querySelector(".modal-dialog");
        var $updataInfo  = document.querySelector(".modal-dialog .logs");
        var $cancel  = document.querySelector(".btn-default");
        var $ok  = document.querySelector(".btn-primary");
        var $progress  = document.querySelector(".progress");
        var $progressBar  = document.querySelector(".progress .progress-bar");

        //暂不更新
        $cancel.onclick = function(){
            window.location = 'http://localhost:3030';
        }

        $updataInfo.innerText = manifest.updataInfo;
        $modalDialog.style.display = 'block';

        var $marginTop = $modalDialog.offsetHeight/2;
        $modalDialog.style.marginTop = -$marginTop + 'px';

        document.querySelector("#updataText .version").innerHTML = manifest.version;

        //立即更新
        $ok.onclick = function(){
            $progress.style.display = 'block';

            //TODO 更新进度条
            $progressBar.style.width = "10%";
            if (!error){
                //console.log("updata...")

                // ------------- Step 2 -------------
                upd.download(function(error, filename) {
                    //console.log("download...")
                    $progressBar.style.width = "30%";

                    if (!error) {
                        // ------------- Step 3 -------------
                        upd.unpack(filename, function(error, newAppPath) {
                            //console.log("unpack...");
                            //console.log(newAppPath);
                            //console.log(error);
                            if(error){
                                alert("更新失败,请下次重启软件时再更新!");
                                window.location = 'http://localhost:3030';
                            }

                            //TODO 更新进度条
                            $progressBar.style.width = "60%";

                            //解压完后删除更新包
                            fse.remove(filename, function(err){
                                if (err) return console.error(err);

                                //TODO 更新进度条
                                $progressBar.style.width = "70%";
                            });

                            if (!error) {
                                //console.log("runInstaller...");
                                var $dirPath = path.dirname(newAppPath);
                                var $getAppPath = process.cwd(); //upd.getAppPath()由于此接口在osx10.10.5下面返回路径不对，所以暂时弃用


                                $progressBar.style.width = "80%";


                                //拷贝文件
                                fse.copy($dirPath, $getAppPath, function (err) {
                                    if (err) {
                                        alert(err);
                                        return false;
                                    }

                                    //TODO 更新进度条
                                    $progressBar.style.width = "90%";


                                    //更新成功文件后删除临时目
                                    fse.remove($dirPath, function (err) {
                                        if (err){
                                            alert('更新失败，请稍后重试!');
                                            gui.App.quit();
                                        }

                                        //TODO 更新进度条
                                        $progressBar.style.width = "100%";
                                        setTimeout(function() {
                                            alert('更新成功,请重启软件!');
                                            gui.App.quit();
                                        },800);
                                    });
                                });
                            }else{
                                alert('更新失败，请下次重启软件时再更新!');
                                window.location = 'http://localhost:3030';
                            }
                        }, manifest);
                    }
                }, manifest);

            }else{
                alert("更新失败,请下次重启软件是再更新!");
                window.location = 'http://localhost:3030';
            }
        }
    }else{
        setTimeout(function(){
            window.location = 'http://localhost:3030';
        },800);
    }
});