/**
 * Created by owenhong on 2016/7/11.
 */
// Load native UI library
var gui = require('nw.gui');
var win = gui.Window.get();

seajs.use(["jquery","vue","Copy","uploader","window"],function($,vue,Copy,Uoloader,Window) {

    //TODO 初始化复制功能
    Copy.init();

    //TODO 初始化上传组件
    var $uoloader = Uoloader;
    $uoloader.initDmUploader('TEST');

    //TODO 初始化窗口操作
    Window.init(true);

    //TODO 清楚logs
    $("#clearLogs").click(function () {
        $("#drag-and-drop-zone").html("");
    });

    //TODO 触发选择文件开关
    $(".multipleFile-box .text").click(function(){
        $("#multipleFile").click();
    });

    //TODO 关闭右侧工具栏
    $("#closeMenu").click(function(){
        let $parentBox = $(this).parent().parent();
        if($parentBox.hasClass("in")){
            $parentBox.removeClass("in").animate({"margin-right":0},500);
        }else{
            $parentBox.addClass("in").animate({"margin-right":"-240px"},500);
        }
    });


    //设置复制内容
    $("body").on("click", ".copy-btn", function () {
        var $this = $(this),
            $copyInput = $(this).siblings(".copy-input"),
            $copyLength = $copyInput.val().length;

        $copyInput.copyText(0, $copyLength,function(){
            $this.siblings(".copy-tips").css("display", "inline-block").fadeOut(1500);
        });
    });
    $("body").on("click", ".copy-btn2", function () {
        var $this = $(this),
            $copyInput = $(this).siblings(".copy-input2"),
            $copyLength = $copyInput.val().length;

        $copyInput.copyText(0, $copyLength,function(){
            $this.siblings(".copy-tips").css("display", "inline-block").fadeOut(1500);
        });
    });
    $("body").on("click", ".copy-btn3", function () {
        var $this = $(this),
            $copyInput = $(this).siblings(".copy-input3"),
            $copyLength = $copyInput.val().length;

        $copyInput.copyText(0, $copyLength,function(){
            $this.siblings(".copy-tips").css("display", "inline-block").fadeOut(1500);
        });
    });


    $.get('/config.js').done(function(data){
        const result = eval("(" + data + ")"),
              ItemsConfig = result,
              projectConfig = {};

        ItemsConfig.Current = result.itemsConfig[0] || '';
        projectConfig.Current = result.itemsConfig[0] || '';

        //TODO 主界面
        let ContentVue = new Vue({
            el: '#content',
            data: ItemsConfig,
            methods: {
                updataMenuIndex: function (i) {
                    let $itemsIndex = jQuery("input[name='itemsIndex']");
                    let $currentIndex = jQuery("input[name='currentIndex']");

                    $itemsIndex.val(i);
                    $currentIndex.val(i);

                    jQuery.get('/config.js').done(function(data) {
                        result = eval("(" + data + ")");

                        ContentVue.$set('Current', result.itemsConfig[i]);
                        projectConfigDialog.$set('Current', result.itemsConfig[i]);

                        jQuery(".menu-list li").eq(i).addClass('cur').siblings().removeClass('cur');
                    });
                },
                addProject:function(e){
                    let $currentIndex = jQuery("input[name='currentIndex']"),
                        $currentSize = jQuery(".menu-list li").size();


                    projectConfigDialog.$set('Current','');
                    $currentIndex.val($currentSize);

                    $(".tab-side li").eq(0).addClass("cur").siblings().removeClass("cur");
                    $(".tab-content").eq(0).show().siblings().hide();


                    jQuery("input[name='dialogStatus']").val("add");//更新dialog类型(add为添加项目)
                    jQuery("#deletProject").hide();
                    jQuery("#modalDialog").show();
                    jQuery("#projectConfigDialog").show();
                },
                editProject:function(){
                    let $currentIndex = jQuery("input[name='currentIndex']").val();

                    //更新diaog里头当前值
                    projectConfigDialog.$set('Current',result.itemsConfig[$currentIndex]);


                    $(".tab-side li").eq(0).addClass("cur").siblings().removeClass("cur");
                    $(".tab-content").eq(0).show().siblings().hide();


                    jQuery("input[name='dialogStatus']").val("edit");//更新dialog类型(add为添加项目)
                    jQuery("#deletProject").show();
                    jQuery("#modalDialog").show();
                    jQuery("#projectConfigDialog").show();
                },
                formSubmit:function(e){
                    jQuery("#controlPanelFrome").submit();
                },
                spriteNameSwitch:function(e){
                    ContentVue.$set('Current.spriteNameSwitch',String(e.target.checked));
                    this.formSubmit();
                },
                cssNameSwitch:function(e){
                    ContentVue.$set('Current.cssNameSwitch',String(e.target.checked));
                    this.formSubmit();
                },
                updataTime:function(e){
                    var nowTime = new Date();
                    var $date = nowTime.getFullYear().toString()
                        + (nowTime.getMonth() + 1 >= 9 ? nowTime.getMonth() + 1 : '0' + (nowTime.getMonth() + 1)).toString()
                        + (nowTime.getDate() >= 10 ? nowTime.getDate() : '0' + nowTime.getDate()).toString()
                        + (nowTime.getHours() >= 10 ? nowTime.getHours() : '0' + nowTime.getHours()).toString()
                        + (nowTime.getMinutes() >= 10 ? nowTime.getMinutes() : '0' + nowTime.getMinutes()).toString();

                    ContentVue.$set('Current.spriteName',$date);
                    ContentVue.$set('Current.cssName',$date);

                    this.formSubmit();
                },
                blurUpdataTime:function(e){
                    var $nowTime = e.target.value;
                    ContentVue.$set('Current.spriteName',$nowTime);
                    ContentVue.$set('Current.cssName',$nowTime);
                    this.formSubmit();
                },
                pxToRemSwitch:function(e){
                    var $checked = String(e.target.checked);
                    ContentVue.$set('Current.pxToRemSwitch',$checked);
                    this.formSubmit();
                }

            }
        });


        //TODO 新增 编辑 项目 Dialog
        let projectConfigDialog = new Vue({
            el: '#projectConfigDialog',
            data: projectConfig,
            methods:{
                changeMenu:function(i){
                    let $thisBox = jQuery("#projectConfigDialog");
                    $thisBox.find(".tab-side li").eq(i).addClass("cur");
                    $thisBox.find(".tab-side li").eq(i).siblings().removeClass("cur");
                    $thisBox.find(".tab-content").eq(i).show().siblings().hide();
                },
                deleProject:function(e){
                    //删除项目
                    e.preventDefault();

                    let $currentItems = $("input[name='currentIndex']").val();
                    let $confirm = confirm("是否确认删除该项目！");
                    if($confirm === true){
                        jQuery.get("/deleteProject?itemsIndex=" + $currentItems)
                        .done(function(data){
                            jQuery("#modalDialog").hide();
                            jQuery("#projectConfigDialog").hide();
                            alert('删除成功！');

                            //TODO 删除对应项目后更新视图
                            result.itemsConfig.splice($currentItems,1);

                            setTimeout(function(){
                                if(jQuery(".menu-list li").size() == 0){
                                    ContentVue.$set('Current', '');
                                    projectConfigDialog.$set('Current', '');
                                }else{
                                    ContentVue.$set('Current', result.itemsConfig[0]);
                                    projectConfigDialog.$set('Current', result.itemsConfig[0]);
                                    jQuery(".menu-list li").eq(0).addClass('cur').siblings().removeClass('cur');
                                    $("input[name='currentIndex']").val(0);
                                }
                            },200);
                        })
                        .fail(function(data){
                            jQuery("#modalDialog").hide();
                            jQuery("#projectConfigDialog").hide();
                            alert("删除失败！")
                        });
                    }
                }
            }
        });


        //TODO 配置信息异步提交
        let configSubmit = function() {
            jQuery(".form-horizontal").submit(function () {
                let $itemsName = jQuery.trim($("input[name='itemsName']").val());
                let $localPath = jQuery.trim($("input[name='localPath']").val());


                //判断是否为空
                if ($("input[name='itemsName']").val() != undefined) {
                    if ($itemsName == "") {
                        $("input[name='itemsName']").siblings(".help-block").html("请输入项目名称");

                        $(".tab-side li").eq(0).addClass("cur").siblings().removeClass("cur");
                        $(".tab-content").eq(0).show().siblings().hide();
                        return false;
                    }
                    if ($localPath == "") {
                        $("input[name='localPath']").parent().siblings(".help-block").html("请输入项目目录");

                        $(".tab-side li").eq(0).addClass("cur").siblings().removeClass("cur");
                        $(".tab-content").eq(0).show().siblings().hide();
                        return false;
                    }
                }

                let formdata = new FormData(this);
                jQuery.ajax({
                    type: 'post',
                    url: '/tools/doConfig',
                    data: formdata,
                    contentType: false,
                    processData: false
                }).done(function (data) {
                    if (data.status) {

                        let $dialogStatus = jQuery("input[name='dialogStatus']").val();

                        alert("保存成功!");

                        jQuery("#modalDialog").hide();
                        jQuery("#projectConfigDialog").hide();

                        //清空错误提示
                        jQuery("input[name='itemsName']").siblings(".help-block").html("");
                        jQuery("input[name='localPath']").parent().siblings(".help-block").html("");


                        //更新视图当新建项目的时候 push到现有 itemsConfig 中
                        if($dialogStatus == 'add'){
                            let $currentIndex = jQuery("input[name='currentIndex']").val();


                            //updata view
                            result.itemsConfig.push(data.Config);
                            ContentVue.$set('Current', result.itemsConfig[$currentIndex]);
                            projectConfigDialog.$set('Current', result.itemsConfig[$currentIndex]);

                            //更新menu list current class 设置延时触发，否则视图更新不及时
                            setTimeout(function(){
                                let $currentSize = jQuery(".menu-list li").size()-1;
                                jQuery(".menu-list li").eq($currentSize).addClass('cur').siblings().removeClass('cur');
                            },100);
                        }else{
                            let $currentIndex = jQuery("input[name='currentIndex']").val();

                            ItemsConfig.itemsConfig.$set($currentIndex, data.Config);
                            ContentVue.$set('Current',data.Config);

                            //更新menu list current class 设置延时触发，否则视图更新不及时
                            setTimeout(function(){
                                jQuery(".menu-list li").eq($currentIndex).addClass('cur').siblings().removeClass('cur');
                            },100);

                        }
                    } else {
                        alert("配置信息失败~");

                        //清空错误提示
                        jQuery("input[name='itemsName']").siblings(".help-block").html("");
                        jQuery("input[name='localPath']").parent().siblings(".help-block").html("");

                        jQuery("#modalDialog").hide();
                        jQuery("#projectConfigDialog").hide();
                    }
                }).fail(function (data) {

                    alert("配置信息失败,请重试~");

                    //清空错误提示
                    jQuery("input[name='itemsName']").siblings(".help-block").html("");
                    jQuery("input[name='localPath']").parent().siblings(".help-block").html("");

                    jQuery("#modalDialog").hide();
                    jQuery("#projectConfigDialog").hide();
                });
                return false;
            });
        }();

        //更新css 和 sprite 版本号和状态
        let ajaxCssSprite = function(){
            jQuery("#controlPanelFrome").submit(function(){
                var formdata = new FormData(this);

                //由于表单禁用formdata无法读取input数据，所以动态传入
                formdata.append("spriteName",ItemsConfig.Current.spriteName);
                formdata.append("cssName",ItemsConfig.Current.cssName);

                jQuery.ajax({
                    type: 'post',
                    url: '/updateCssSprite',
                    data: formdata,
                    contentType: false,
                    processData: false
                }).done(function (data) {
                    console.log("更新右侧操作面板成功");
                });
                return false;
            });
        }();
    });
});
