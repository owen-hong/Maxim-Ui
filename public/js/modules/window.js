/**
 * Created by owenhong on 2016/2/24.
 */
define(function(require, exports, module) {
    var init = function(updateCssSprite) {

        //TODO 阻止文件拖拽进窗口
        $(window).on('dragover', function (e) {
            e.preventDefault();
            e.originalEvent.dataTransfer.dropEffect = 'none';
        });
        $(window).on('drop', function (e) {
            e.preventDefault();
        });

        //TODO 阻止界面回退按钮导致bug input除外
        $(window).bind("keydown",function(e){
            var $type = e.target.type;
            if(e.keyCode==8 && $type !== 'text' && $type !== 'password' && $type !== 'textarea'){
                e.preventDefault();
            }
        });


        //TODO 浏览器打开窗口 超链接
        $("body").on("click", ".drop-files-box .logs-text-box a,#apply-tiny-api", function () {
            var $ftpSwitch = $("input[name='ftpSwitch']").prop("checked");
            var $url = $(this).data("href");

            if($ftpSwitch === true){
                if (!$url == undefined || !$url == "") {
                    gui.Shell.openExternal($url);
                }
            }else{
                if (!$url == undefined || !$url == "") {
                    gui.Shell.showItemInFolder($url);
                }
            }
        });

        //TODO 选择文件夹
        $(".file-local").click(function(){
            $("#chooseLocal").click();
        });
        $("body").on("click",".file-dest",function(){
            $("#choosedest").click();
        });
        $("body").on("click",".file-sync",function(){
            $("#chooseSync").click();
        });
        $("#chooseLocal").on("change", function () {
            var $val = $(this).val();
            $("#localPath").val($val);
        });

        $("#choosedest").on("change", function () {
            var $val = $(this).val();
            $("#destPath").val($val);
        });
        $("#chooseSync").on("change", function () {
            var $val = $(this).val();
            $("#versionsFilePath").val($val);
        });


        //TODO 启动托盘
        var Tray = function(){
            var tray = new gui.Tray({ title: 'Maxim', icon: 'app.png' });

            tray.tooltip = 'Maxim';

            //添加一个菜单
            var menu = new gui.Menu();
            menu.append(new gui.MenuItem({ label: '显示窗口' }));
            menu.append(new gui.MenuItem({ label: '退出' }));


            menu.items[0].click = function() {
                win.show();
            }
            menu.items[1].click = function() {
                win.close();
            }
            tray.menu = menu;
            //click事件
            tray.on('click',function () {
                win.show();
            });
        };


        //TODO 全局控制窗口开关
        var isMac = (navigator.platform == "Mac68K") || (navigator.platform == "MacPPC") || (navigator.platform == "Macintosh") || (navigator.platform == "MacIntel");
        if(isMac){
            $("#closeSortware").click(function(){
                win.close();
            });
        }else{
            Tray();//windows下启动托盘

            $("#closeSortware").click(function(){
                win.hide();
            });
        }

        //全屏
        $(".global-operations .fullscreen-btn").click(function(){
            win.toggleFullscreen();
        });

        //缩小
        $(".global-operations .minimize-btn").click(function(){
            win.minimize();
        });

        //置顶
        $(".global-operations .always-on-top-btn").click(function(){
            var $this = $(this);
            if($this.hasClass("cur")){
                $this.attr("title","窗口置顶");
                $this.removeClass("cur");
                win.setAlwaysOnTop(false);
            }else{
                $this.attr("title","取消窗口置顶");
                $this.addClass("cur");
                win.setAlwaysOnTop(true);
            }
        });


        //TODO Dialog 操作
        $("#settingBtn").click(function(){
            $("#modalDialog,#globalConfigDialog").show();
        });

        $("#globalConfigDialog li").click(function(){
            var $index = $(this).index();
            $(this).addClass("cur").siblings().removeClass("cur");
            $("#globalConfigDialog").find(".tab-content").eq($index).show().siblings().hide();

        });

        //TODO 取消按钮当前窗口
        $("#cancelWin,#closeDilog,#closeAbout").click(function(e){
            e.preventDefault();

            //清空错误提示
            jQuery("input[name='itemsName']").siblings(".help-block").html("");
            jQuery("input[name='localPath']").parent().siblings(".help-block").html("");
            $("#modalDialog,#projectConfigDialog,#globalConfigDialog").hide();
        });
    }

    exports.init = init;
});