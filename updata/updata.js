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
if(!gui.App.argv.length) {
    // ------------- Step 1 -------------
    upd.checkNewVersion(function(error, newVersionExists, manifest) {
        if(error){
            //window.location = 'http://localhost:3030';
        }
        console.log(newVersionExists);
        console.log(manifest);

        if (!error && newVersionExists) {

            console.log("updata...")
            // ------------- Step 2 -------------
            upd.download(function(error, filename) {
                console.log("download...")
                console.log(error);
                console.log(filename);

                if (!error) {
                    // ------------- Step 3 -------------
                    upd.unpack(filename, function(error, newAppPath) {
                        console.log("unpack...");
                        console.log(newAppPath);
                        console.log(error);

                        //解压完后删除更新包
                        fse.remove(filename, function(err){
                            if (err) return console.error(err);

                            console.log("zip delet success!")
                        });

                        if (!error) {
                            console.log("runInstaller...");
                            var $dirPath = path.dirname(newAppPath);
                            var $getAppPath = process.cwd(); //upd.getAppPath()由于此接口在osx10.10.5下面返回路径不对，所以暂时弃用

                            console.log($dirPath,$getAppPath);

                            //拷贝文件
                            fse.copy($dirPath, $getAppPath, function (err) {
                                if (err) return console.error(err);

                                //更新成功文件后删除临时目
                                fse.remove($dirPath, function (err) {
                                    if (err){
                                        gui.App.quit();
                                    }
                                    console.log("updata success!")
                                    //gui.App.quit();
                                });
                            });
                        }
                    }, manifest);
                }
            }, manifest);
        }else{
            console.log("no need updata!")
        }
    });
}