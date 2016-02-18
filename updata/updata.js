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
var copyPath, execPath;


// Args passed when new app is launched from temp dir during update
if(gui.App.argv.length) {
    console.log("abc");
    // ------------- Step 5 -------------
    copyPath = gui.App.argv[0];
    execPath = gui.App.argv[1];

    console.log(copyPath);
    console.log(execPath);

    // Replace old app, Run updated app from original location and close temp instance
    upd.install(copyPath, function(err) {

        console.log(err);

        if(!err) {

            // ------------- Step 6 -------------
            upd.run(execPath, null);
            gui.App.quit();
        }
    });
}else { // if no arguments were passed to the app

    console.log("ued");

    // ------------- Step 1 -------------
    upd.checkNewVersion(function(error, newVersionExists, manifest) {
        console.log(error);
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

                        if (!error) {
                            console.log("runInstaller...");
                            var $dirPath = path.dirname(newAppPath);
                            var $getAppPath = upd.getAppPath();
                            var $getAppExec = upd.getAppExec();

                            console.log($dirPath,$getAppPath);

                            //拷贝文件
                            fse.copy($dirPath, $getAppPath, function (err) {
                                if (err) return console.error(err)
                                console.log('copy success!')

                                //更新成功文件后删除临时目录
                                //fse.remove($dirPath, function (err) {
                                //    if (err){
                                //        gui.App.quit();
                                //    }
                                //
                                //    //gui.App.quit();
                                //});

                            });

                            // ------------- Step 4 -------------
                            //upd.runInstall(newAppPath, [upd.getAppPath(), upd.getAppExec()],{});
                            //upd.install($dirPath,function(error){
                            //    console.log("install...");
                            //    console.log(error);
                            //    //gui.App.quit();
                            //    //updater.run(upd.getAppPath()+"\\maxim-test\\Maxim.exe");
                            //});
                        }
                    }, manifest);
                }
            }, manifest);
        }else{
            console.log("no need updata!")
        }
    });
}