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

        //TODO 全局控制窗口开关
        var isMac = (navigator.platform == "Mac68K") || (navigator.platform == "MacPPC") || (navigator.platform == "Macintosh") || (navigator.platform == "MacIntel");
        if(isMac){
            $(".global-operations a").hide();
        }

        $(".global-operations .close-btn").click(function(){
            win.close();
        });
        $(".global-operations .fullscreen-btn").click(function(){
            win.toggleFullscreen();
        });

        $(".global-operations .minimize-btn").click(function(){
            win.minimize();
        });
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

        //TODO dialog config
        if(isMac){
            var $DialogConfig = {
                frame:true,
                position: 'center',
                height:418,
                width:610
            }
        }else{
            var $DialogConfig = {
                frame:false,
                position: 'center',
                height:418,
                width:610
            }
        }

        var setAlwaysOnTop = function(win){
            var $alwaysOnTop = $("#alwaysOnTop").hasClass("cur");
            if($alwaysOnTop){
                win.setAlwaysOnTop(true);
            }else{
                win.setAlwaysOnTop(false);
            }
        }


        //TODO 全局设置
        $("#settingBtn").click(function(){
            gui.Window.open('http://localhost:3030/globalSetting',{
                frame:$DialogConfig.frame,
                position: $DialogConfig.position,
                width:640,
                height: 370,
                focus:true,
                resizable:false,
                id:'globalSetting'
            },function(new_win){

                setAlwaysOnTop(new_win);

                new_win.on('close', function () {
                    new_win.hide(); // PRETEND TO BE CLOSED ALREADY
                    new_win.close(true);//防止进程没被杀死
                });
            });
        });

        //TODO 新增项目
        var addProjectWinFun = function(){
            var $menuListSite = $(".menu-list li").size();

            gui.Window.open('http://localhost:3030/addProject?itemsIndex=' + $menuListSite,{
                frame:$DialogConfig.frame,
                position: $DialogConfig.position,
                width:$DialogConfig.width,
                height: $DialogConfig.height,
                resizable:false,
                focus:true,
                id:"addProjectWin"
            },function(new_win){

                setAlwaysOnTop(new_win);

                new_win.on('close', function () {
                    new_win.hide(); // PRETEND TO BE CLOSED ALREADY
                    updateCssSprite(true,$menuListSite);
                    new_win.close(true);//防止进程没被杀死
                });
            });
        }
        $("#addProject").click(function(){
            addProjectWinFun();
        });


        //TODO 编辑项目
        var editProjectWinFun = function(){
            var $currentItems = $("input[name='itemsIndex']").val();
            gui.Window.open('http://localhost:3030/editProject?itemsIndex=' + $currentItems, {
                frame: $DialogConfig.frame,
                position: $DialogConfig.position,
                width: $DialogConfig.width,
                height: $DialogConfig.height,
                resizable:false,
                focus: true,
                id:"editProjectWin"
            },function(new_win){

                setAlwaysOnTop(new_win);

                new_win.on('close', function () {
                    new_win.hide(); // PRETEND TO BE CLOSED ALREADY
                    updateCssSprite(false, $currentItems);
                    new_win.close(true);//防止进程没被杀死
                });
            });
        }
        $(".edit-btn").click(function() {
            if($(".menu-list li").size() > 0){
                editProjectWinFun();
            }else{
                addProjectWinFun();
            }
        });


        //删除项目
        $("#deletProject").click(function(e){
            e.preventDefault();

            var $currentItems = $("input[name='currentIndex']").val();

            var r = confirm("是否确认删除该项目！")
            if(r==true){
                $.get("/deleteProject?itemsIndex=" + $currentItems).done(function(data){
                    alert('删除成功！');
                    win.close();
                }).fail(function(data){
                    alert("删除失败！")
                });
            }
        });

        //TODO 取消按钮当前窗口
        $("#cancelWin").click(function(e){
            e.preventDefault();
            win.close();
        });
    }


    exports.init = init;
});