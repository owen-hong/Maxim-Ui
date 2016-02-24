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
        $("#closeSortware").click(function(){
            win.close();
        });
        $("#enterFullscreen").click(function(){
            win.toggleFullscreen();
        });

        $("#minimize").click(function(){
            win.minimize();
        });

        $("#alwaysOnTop").click(function(){
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
        var $DialogConfig = {
            frame:false,
            toolbar:false,
            position: 'center',
            height:500,
            width:640
        }

        //TODO 全局设置
        var globalSetting;
        $("#settingBtn").click(function(){
            if(!globalSetting){
                globalSetting = gui.Window.open('globalSetting',{
                    frame:$DialogConfig.frame,
                    toolbar:$DialogConfig.toolbar,
                    position: $DialogConfig.position,
                    width:512,
                    height: 370,
                    focus:true
                });

                globalSetting.on('close', function () {
                    this.hide(); // PRETEND TO BE CLOSED ALREADY
                    globalSetting = undefined;
                    this.close(true);//防止进程没被杀死
                });
            }else{
                globalSetting.focus();
            }
        });

        //TODO 新增项目
        var addProjectWin;
        var addProjectWinFun = function(){
            if(!addProjectWin){
                var $menuListSite = $(".menu-list li").size();

                addProjectWin = gui.Window.open('addProject?itemsIndex=' + $menuListSite,{
                    frame:$DialogConfig.frame,
                    toolbar:$DialogConfig.toolbar,
                    position: $DialogConfig.position,
                    width:$DialogConfig.width,
                    height: $DialogConfig.height,
                    focus:true
                });

                addProjectWin.on('close', function () {
                    this.hide(); // PRETEND TO BE CLOSED ALREADY
                    updateCssSprite(true,$menuListSite);
                    addProjectWin = undefined;
                    this.close(true);
                });
            }else{
                addProjectWin.focus();
            }
        }
        $("#addProject").click(function(){
            addProjectWinFun();
        });


        //TODO 编辑项目
        var editProjectWin;
        var editProjectWinFun = function(){
            if(!editProjectWin) {
                var $currentItems = $("input[name='itemsIndex']").val();
                editProjectWin = gui.Window.open('editProject?itemsIndex=' + $currentItems, {
                    frame: $DialogConfig.frame,
                    toolbar: $DialogConfig.toolbar,
                    position: $DialogConfig.position,
                    width: $DialogConfig.width,
                    height: $DialogConfig.height,
                    focus: true
                });

                editProjectWin.on('close', function () {
                    this.hide(); // PRETEND TO BE CLOSED ALREADY
                    updateCssSprite(false, $currentItems);
                    editProjectWin = undefined;
                    this.close(true);
                });
            }else{
                editProjectWin.focus();
            }
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