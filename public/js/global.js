/**
 * Created by owenhong on 2015/11/12.
 */

// Load native UI library
var gui = require('nw.gui');
var win = gui.Window.get();

define(function(require) {
    //初始化复制功能
    require('Copy');

    //TODO初始化上传组件
    var $uoloader = require('uploader');

    //TODO 全局控制
    $("#closeSortware").click(function(){
        win.close();
    });
    $("#enterFullscreen").click(function(){
        win.toggleFullscreen();
    });

    $("#minimize").click(function(){
        win.minimize();
    });



    //TODO 关闭右侧工具栏
    $("#close-btn").click(function(){
        if($(this).parent().hasClass("in")){
            $(this).parent().removeClass("in").animate({"margin-right":"0"},500);
        }else{
            $(this).parent().addClass("in").animate({"margin-right":"-240px"},500);
        }
    });


    //TODO 选择文件夹
    $("#chooseLocal").on("change", function () {
        var $val = $(this).val();
        $("#localPath").val($val);
    });

    $("#choosedest").on("change", function () {
        var $val = $(this).val();
        $("#destPath").val($val);
    });

    //TODO 自定义dest目录
    var $destPathVal = $("#destPath").val();
    if ($destPathVal == "") {
        $(".choose-dest").parent().hide();
        $(".dest-path").prop("disabled", true);
        $(".file-dest").hide();
    } else {

        $(".choose-dest").parent().show();
        $(".dest-path").prop("disabled", "");
        $(".file-dest").show();
        $("#destPathSwitch").prop("checked", true);
    }
    $("#destPathSwitch").on("change", function () {
        var $val = $(this).prop("checked");
        if ($val) {
            $(".choose-dest").parent().show();
            $(".dest-path").prop("disabled", "");
            $(".file-dest").show();
        } else {
            $(".choose-dest").parent().hide();
            $(".dest-path").prop("disabled", "disabled");
            $(".file-dest").hide();
        }
    });


    /*****TODO 初始化雪碧图规则和CSS规则 ******/
    var $spriteNameSwitch = $("input[name='spriteNameSwitch']").prop('checked');
    var $cssNameSwitch = $("input[name='cssNameSwitch']").prop('checked');
    if ($spriteNameSwitch === true) {
        $("input[name='spriteName']").prop("disabled", "");
        $("#changeSpriteKey").show();
    }else{
        $("input[name='spriteName']").prop("disabled", "disabled");
        $("#changeSpriteKey").hide();
    }
    if ($cssNameSwitch === true) {
        $("input[name='cssName']").prop("disabled", "");
        $("#changeCssKey").show();
    }else{
        $("input[name='cssName']").prop("disabled", "disabled");
        $("#changeCssKey").hide();
    }

    //TODO 开启关闭状态切换
    $("input[name='spriteNameSwitch']").on("change", function () {
        var $spriteNameSwitch = $(this).prop('checked');
        if ($spriteNameSwitch === true) {
            $("input[name='spriteName']").prop("disabled", "");
            $("#changeSpriteKey").show();
        } else {
            $("input[name='spriteName']").prop("disabled", "disabled");
            $("#changeSpriteKey").hide();
        }
    })
    $("input[name='cssNameSwitch']").on("change", function () {
        var $cssNameSwitch = $(this).prop('checked');
        if ($cssNameSwitch === true) {
            $("input[name='cssName']").prop("disabled", "");
            $("#changeCssKey").show();
        } else {
            $("input[name='cssName']").prop("disabled", "disabled");
            $("#changeCssKey").hide();
        }
    });
    $("input[name='pxToRemSwitch']").on("change", function () {
        var $switch = $(this).prop('checked');
        if ($switch === true) {
            $("input[name='rootValue']").prop("disabled", "");
            $("input[name='propertyBlackList']").prop("disabled", "");
        } else {
            $("input[name='rootValue']").prop("disabled", "disabled");
            $("input[name='propertyBlackList']").prop("disabled", "disabled");
        }


    });
    /******************end**********************/

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
        var $ftpSwitch = $("input[name='ftpSwitch']:checked").val();
        var $url = $(this).data("href");

        if($ftpSwitch == "true"){
            if (!$url == undefined || !$url == "") {
                gui.Shell.openExternal($url);
            }
        }else{
            if (!$url == undefined || !$url == "") {
                gui.Shell.showItemInFolder($url);
            }
        }
    });


    //TODO 清楚logs
    $("#clearLogs").click(function () {
        $("#drag-and-drop-zone").html("");
    });

    //TODO 路径配置
    $(".panel-heading").click(function () {
        $(this).siblings(".panel-collapse").toggleClass("in");
    });

    //TODO 配置信息异步提交
    $(".form-horizontal").submit(function () {
        var $itemsName = $.trim($("input[name='itemsName']").val());
        var $localPath = $.trim($("input[name='localPath']").val());

        if($("input[name='itemsName']").val() != undefined) {
            if ($itemsName == "") {
                $("input[name='itemsName']").siblings(".help-block").html("请输入项目名称");
                return false;
            }
            if ($localPath == "") {
                $("input[name='localPath']").parent().siblings(".help-block").html("请输入项目目录");
                return false;
            }
        }
        var $val = $("#destPathSwitch").prop("checked");
        var formdata = new FormData(this);
        $.ajax({
            type: 'post',
            url: 'http://localhost:3030/tools/doConfig',
            data: formdata,
            contentType: false,
            processData: false
        }).done(function (data) {
            if (data.status) {
                alert("保存成功!");
                win.close();
            } else {
                alert("配置信息保存失败！");
                win.close();
            }
        }).fail(function (data) {
            console.log("保存失败！");
            win.close();
        });

        return false;
    });


    //TODO 更新Css Sprite
    var updateCssSprite = function(newConfig,itemsIndex){
        var $itemsIndex = $("input[name='itemsIndex']").val();

        if(newConfig===true) {
            $itemsIndex = itemsIndex;
        }

        $.get("/updateProject?itemsIndex=" + $itemsIndex).done(function(result){
            var $menuList = $(".menu-list li").length;
            var data = result.Config || "";

            if(newConfig===true){
                //新增项目
                if(result.status===true && data.itemsName !==""){
                    var $li = '<li class="cur"><a href="javascript:void(0);">'+ data.itemsName +'</a><i class="arrow-left"></i></li>';
                    $(".menu-list li").removeClass("cur");
                    $(".menu-list").append($li);
                    $(".itemes-info .text").text(data.itemsName);
                    $("input[name='itemsIndex']").val($itemsIndex);
                }else{
                    return false;
                }
            }else{
                //编辑项目
                if(result.status ===true){
                    if($menuList-result.itemsLength > 0){//删除不是最后一个项目的判断
                        $(".menu-list li").eq($itemsIndex).remove();
                        $(".menu-list li").eq($itemsIndex).addClass("cur").children("a").text(data.itemsName);
                        $(".itemes-info .text").text(data.itemsName);
                        $("input[name='itemsIndex']").val($itemsIndex);
                    }else{
                        $(".menu-list li").eq($itemsIndex).children("a").text(data.itemsName);
                        $(".itemes-info .text").text(data.itemsName);
                    }
                }else{//删除最后一个项目
                    $(".menu-list li").eq($itemsIndex).remove();

                    if($(".menu-list li").size() > 0){
                        $(".menu-list li").eq($itemsIndex-1).addClass("cur").children("a").text(data.itemsName);
                        $(".itemes-info .text").text(data.itemsName);
                        $("input[name='itemsIndex']").val($itemsIndex-1);
                    }else{
                        $(".itemes-info .text").text("");
                        $("input[name='itemsIndex']").val("");
                    }
                }
            }

            //FTP信息更新
            var $ftpSwitch = data.ftpSwitch || "false";
            if($ftpSwitch == "true"){
                $("input[name='ftpSwitch']").eq(0).prop("checked",true);
                $("input[name='ftpSwitch']").eq(1).prop("checked",false);
            }else{
                $("input[name='ftpSwitch']").eq(0).prop("checked",false);
                $("input[name='ftpSwitch']").eq(1).prop("checked",true);
            }

            //图片更新
            var $imgSwitch = data.imgSwitch || "youtu";
            if($imgSwitch == "youtu"){
                $("input[name='imgSwitch']").eq(0).prop("checked",false);
                $("input[name='imgSwitch']").eq(1).prop("checked",true);
            }else{
                $("input[name='imgSwitch']").eq(0).prop("checked",true);
                $("input[name='imgSwitch']").eq(1).prop("checked",false);
            }

            //样式和sprites更新
            var $spriteNameSwitch = data.spriteNameSwitch || "false";
            if ($spriteNameSwitch == "true") {
                $("input[name='spriteNameSwitch']").prop("checked",true);
                $("input[name='spriteName']").prop("disabled", "").val(data.spriteName);
                $("#changeSpriteKey").show();
            } else {
                $("input[name='spriteNameSwitch']").prop("checked",false);
                $("input[name='spriteName']").prop("disabled", "disabled").val(data.spriteName);
                $("#changeSpriteKey").hide();
            }
            var $cssNameSwitch = data.cssNameSwitch || "false";
            if ($cssNameSwitch == "true") {
                $("input[name='cssNameSwitch']").prop("checked",true);
                $("input[name='cssName']").prop("disabled", "").val(data.cssName);

                $("#changeCssKey").show();
            } else {
                $("input[name='cssNameSwitch']").prop("checked",false);
                $("input[name='cssName']").prop("disabled", "disabled").val(data.cssName);
                $("#changeCssKey").hide();
            }

            // px2rem 信息更新
            var $pxToRemSwitch = data.pxToRemSwitch || "false";
            var $rootValue = data.rootValue || "75";
            var $propertyBlackList = data.propertyBlackList || "";
            if($pxToRemSwitch == "true"){
                $("input[name='pxToRemSwitch']").prop("checked",true);
                $("input[name='rootValue']").prop("disabled", "");
                $("input[name='propertyBlackList']").prop("disabled", "");
            }else{
                $("input[name='pxToRemSwitch']").prop("checked",false);
                $("input[name='rootValue']").prop("disabled", "disabled");
                $("input[name='propertyBlackList']").prop("disabled", "disabled");
            }
            $("input[name='rootValue']").val($rootValue);
            $("input[name='propertyBlackList']").val($propertyBlackList);
        });
    }


    //初始化 initDmUploader
    $uoloader.initDmUploader(updateCssSprite);

    //TODO 切换项目
    $("body").on("click",".menu-list li",function(){
        var $index = $(this).index();
        var $title = $(this).children("a").text();

        $(this).addClass("cur").siblings().removeClass("cur");
        $("input[name='itemsIndex']").val($index);
        $(".itemes-info .text").text($title);

        $("#drag-and-drop-zone").html("").append('<em class="drop-tips">请拖拽文件到此区域</em>');
        $(".drop-tips").show();
        //更新界面
        updateCssSprite(false);
    });


    //更新css 和 sprite 版本号和状态
    var ajaxCssSprite = function(){
        var $index = $("input[name='itemsIndex']").val();

        var $spriteNameSwitch = $("input[name='spriteNameSwitch']").prop("checked");
        var $spriteName = $("input[name='spriteName']").val();

        var $cssNameSwitch = $("input[name='cssNameSwitch']").prop("checked");
        var $cssName = $("input[name='cssName']").val();

        var $ftpSwitch = $("input[name='ftpSwitch']:checked").val();
        var $imgSwitch = $("input[name='imgSwitch']:checked").val();

        var $pxToRemSwitch = $("input[name='pxToRemSwitch']").prop("checked");
        var $rootValue = $("input[name='rootValue']").val();
        var $propertyBlackList = $("input[name='propertyBlackList']").val();


        $.post("/updateCssSprite",{
            itemsIndex:$index,
            spriteNameSwitch:$spriteNameSwitch,
            spriteName:$spriteName,
            cssNameSwitch:$cssNameSwitch,
            cssName:$cssName,
            ftpSwitch:$ftpSwitch,
            imgSwitch:$imgSwitch,
            pxToRemSwitch:$pxToRemSwitch,
            rootValue:$rootValue,
            propertyBlackList:$propertyBlackList
        }).done(function(data){
            console.log('右侧操作栏更新成功!');
        });
    }

    //监听spriteNameSwitch cssNameSwitch
    $("input[name='spriteNameSwitch'],input[name='cssNameSwitch'],input[name='imgSwitch'],input[name='ftpSwitch'],input[name='pxToRemSwitch']").on("change",function(){
        ajaxCssSprite();
    });
    $("input[name='rootValue'],input[name='propertyBlackList']").blur(function(){
        ajaxCssSprite();
    });



    //换一个时间戳
    $("#changeSpriteKey").click(function () {
        var $date = Math.round(new Date().getTime() / 1000);
        $("input[name='spriteName']").val($date);
        ajaxCssSprite();
    });
    $("#changeCssKey").click(function () {
        var $date = Math.round(new Date().getTime() / 1000);
        $("input[name='cssName']").val($date);
        ajaxCssSprite();
    });



    //TODO dialog config
    var $DialogConfig = {
        frame:false,
        toolbar:false,
        position: 'center',
        height:500,
        width:640
    }

    //TODO 新增项目
    var addProjectWin = function(){
        var $menuListSite = $(".menu-list li").size();

        var addProjectWin = gui.Window.open('addProject?itemsIndex=' + $menuListSite,{
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
            this.close(true);
        });
    }

    $("#addProject").click(function(){
        addProjectWin();
    });

    //TODO 编辑项目
    var editProjectWin = function(){
        var $currentItems = $("input[name='itemsIndex']").val();
        var editProjectWin = gui.Window.open('editProject?itemsIndex=' + $currentItems,{
            frame:$DialogConfig.frame,
            toolbar:$DialogConfig.toolbar,
            position: $DialogConfig.position,
            width:$DialogConfig.width,
            height: $DialogConfig.height,
            focus:true
        });

        editProjectWin.on('close', function () {
            this.hide(); // PRETEND TO BE CLOSED ALREADY
            updateCssSprite(false,$currentItems);
            this.close(true);
        });
    }
    $(".edit-btn").click(function() {
        if($(".menu-list li").size() > 0){
            editProjectWin();
        }else{
            addProjectWin();
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


    //TODO 全局设置
    $("#settingBtn").click(function(){
        var globalSetting = gui.Window.open('globalSetting',{
            frame:$DialogConfig.frame,
            toolbar:$DialogConfig.toolbar,
            position: $DialogConfig.position,
            width:512,
            height: 370,
            focus:true
        });

        globalSetting.on('close', function () {
            this.hide(); // PRETEND TO BE CLOSED ALREADY
            this.close(true);//防止进程没被杀死
        });
    });


    //todo 关闭当前窗口
    $("#cancelWin").click(function(e){
        e.preventDefault();
        win.close();
    });


    // TODO 编辑新增项目切换
    var $tabIndex = $(".tab-side ul").data("index");
    $(".tab-side li").eq($tabIndex).children("a").addClass("cur");
    $(".tab-side li").eq($tabIndex).siblings().children("a").removeClass("cur");
    $(".tab-content").eq($tabIndex).show().siblings().hide();


    $(".tab-side li").click(function(){
        var $index = $(this).index();
        $(this).children("a").addClass("cur");
        $(this).siblings().children("a").removeClass("cur");

        $(".tab-content").eq($index).show().siblings().hide();
    });

    $(".file-local").click(function(){
        $("#chooseLocal").click();
    });
    $(".file-dest").click(function(){
        $("#choosedest").click();
    });

});











