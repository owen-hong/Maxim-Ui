/**
 * Created by owenhong on 2015/11/12.
 */

// Load native UI library
var gui = require('nw.gui');
var win = gui.Window.get();

seajs.use(["jquery","Copy","uploader","window"],function($,Copy,Uoloader,Window) {


    //初始化复制功能
    Copy.init();

    //TODO初始化上传组件
    var $uoloader = Uoloader;


    //TODO 关闭右侧工具栏
    $("#close-btn").click(function(){
        var $parentBox = $(this).parent().parent();
        if($parentBox.hasClass("in")){
            $parentBox.removeClass("in").animate({"margin-right":0},500);
        }else{
            $parentBox.addClass("in").animate({"margin-right":"-240px"},500);
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
    var $destPathVal = $.trim($("#destPath").val());
    var $defaultDestPath = $("#destPath").data("path");
    if ($destPathVal == $defaultDestPath) {
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




    //TODO 清楚logs
    $("#clearLogs").click(function () {
        $("#drag-and-drop-zone").html("");
    });


    //TODO 配置信息异步提交
    $(".form-horizontal").submit(function () {
        var $itemsName = $.trim($("input[name='itemsName']").val());
        var $localPath = $.trim($("input[name='localPath']").val());

        //判断是否为空
        if($("input[name='itemsName']").val() != undefined) {
            if ($itemsName == "") {
                $("input[name='itemsName']").siblings(".help-block").html("请输入项目名称");

                $(".tab-side li a").removeClass("cur");
                $(".tab-side li").eq(0).children("a").addClass("cur");
                $(".tab-content").eq(0).show().siblings().hide();
                return false;
            }
            if ($localPath == "") {
                $("input[name='localPath']").parent().siblings(".help-block").html("请输入项目目录");
                $(".tab-side li a").removeClass("cur");
                $(".tab-side li").eq(0).children("a").addClass("cur");
                $(".tab-content").eq(0).show().siblings().hide();
                return false;
            }
        }

        var $val = $("#destPathSwitch").prop("checked");
        var formdata = new FormData(this);
        $.ajax({
            type: 'post',
            url: '/tools/doConfig',
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
                $("input[name='ftpSwitch']").prop("checked",true);
            }else{
                $("input[name='ftpSwitch']").prop("checked",false);
            }

            //图片更新
            var $imgSwitch = data.imgSwitch || "imagemin";
            if($imgSwitch == "tinyimg"){
                $("input[name='imgSwitch']").eq(0).prop("checked",true);
                $("input[name='imgSwitch']").eq(1).prop("checked",false);
            }
            //else if($imgSwitch == "youtu"){
            //    $("input[name='imgSwitch']").eq(0).prop("checked",false);
            //    $("input[name='imgSwitch']").eq(1).prop("checked",true);
            //    $("input[name='imgSwitch']").eq(2).prop("checked",false);
            //}
            else{
                $("input[name='imgSwitch']").eq(0).prop("checked",false);
                $("input[name='imgSwitch']").eq(1).prop("checked",true);
            }

            //样式和sprites更新
            var $spriteNameSwitch = data.spriteNameSwitch || "false";
            if ($spriteNameSwitch == "true") {
                $("input[name='spriteNameSwitch']").prop("checked",true);
                //$("#changeSpriteKey").show();
            } else {
                $("input[name='spriteNameSwitch']").prop("checked",false);
                //$("#changeSpriteKey").hide();
            }
            $("input[name='spriteName']").val(data.spriteName);

            var $cssNameSwitch = data.cssNameSwitch || "false";
            if ($cssNameSwitch == "true") {
                $("input[name='cssNameSwitch']").prop("checked",true);
                //$("#changeCssKey").show();
            } else {
                $("input[name='cssNameSwitch']").prop("checked",false);
                //$("#changeCssKey").hide();
            }
            $("input[name='cssName']").val(data.cssName);

            var $imgSyncSwitch = data.imgSyncSwitch || "false";
            if ($cssNameSwitch == "true") {
                $("input[name='imgSyncSwitch']").prop("checked",true);
            } else {
                $("input[name='imgSyncSwitch']").prop("checked",false);
            }
            $("input[name='imgSyncName']").val(data.spriteName);
            $("#updataTimeVal").val(data.spriteName);


            var $resourceSyncSwitch = data.resourceSyncSwitch || "false";
            if ($resourceSyncSwitch == "true") {
                $("input[name='resourceSyncSwitch']").prop("checked",true);
            } else {
                $("input[name='resourceSyncSwitch']").prop("checked",false);
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
        $("#controlPanelFrome").submit(function(){
            var $spriteName = $("input[name='spriteName']").val();
            var $cssName = $("input[name='cssName']").val();
            var $imgSyncName = $("input[name='imgSyncName']").val();

            var formdata = new FormData(this);
            //由于表单禁用formdata无法读取input数据，所以动态传入
            formdata.append("spriteName",$spriteName);
            formdata.append("cssName",$cssName);
            formdata.append("imgSyncName",$imgSyncName);

            $.ajax({
                type: 'post',
                url: '/updateCssSprite',
                data: formdata,
                contentType: false,
                processData: false
            }).done(function (data) {
                console.log("更新右侧操作面板成功");
            })

            return false;
        });
    }();

    //监听右侧操作栏Input是否被修改
    $(".operations-box input").change(function(){
        $("#controlPanelFrome").submit();
    });

    $("input[name='rootValue'],input[name='propertyBlackList']").blur(function(){
        $("#controlPanelFrome").submit();
    });


    //TODO 更新时间戳
    $("#updataTimeBtn").click(function () {
        var $date = Math.round(new Date().getTime() / 1000);
        $("#updataTimeVal").val($date);
        $("input[name='spriteName'],input[name='cssName'],input[name='imgSyncName']").val($date);
        $("#controlPanelFrome").submit();
    });
    $("#updataTimeVal").blur(function(){
        var $val = $(this).val();
        $("input[name='spriteName'],input[name='cssName'],input[name='imgSyncName']").val($val);
        $("#controlPanelFrome").submit();
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

    //图压缩开关
    $("input[name='imgMasterSwitch']").on("change",function(){
        $("#imgRadioBox").slideToggle();
    });

    //触发选择文件开关
    $(".multipleFile-box .text").click(function(){
        $("#multipleFile").click();
    });


    //初始化窗口操作
    Window.init(updateCssSprite);

});










