/**
 * Created by owenhong on 2015/12/24.
 *
 */


define(function(require, exports, module) {

    /*
     * TODO dmUploader
     * */
    var $dmuploader = require('dmuploader');

    //返回ajax数据函数处理
    var uploadAjaxSuccess = function (result) {

        var $fileBox = $("#drag-and-drop-zone");
        var $ftpSwitch = $("input[name='ftpSwitch']").prop("checked");

        //隐藏loading
        $("#loadding-box").hide();
        $(".drop-tips").hide();

        //提交时间更新
        var myDate = new Date();
        var $currentDate = myDate.getHours() + ':' + myDate.getMinutes() + ':' + myDate.getSeconds();


        //输出路径处理
        var PathExport = function(pathType){
            var $copyContent = '';
            var $testUrl = result.testPath;
            var $releaseUrl = result.releasePath;
            var $UserDest = result.destPath;

            var $DestPath = "<div class='logs-box'><h3 class='releasePath'>临时目录文件列表</h3><div class='logs-text-box'>";
            var $releasePath = "<div class='logs-box'><h3 class='releasePath'>提单路径</h3><div class='logs-text-box'>";
            var $testPath = "<div class='logs-box'><h3>测试地址</h3><div class='logs-text-box'>";
            var $errorMessage="";

            if (result.errorMessage.length > 0) {
                $errorMessage += "<div class='logs-box'><div class='logs-text-box'><p><em style='color:red'>Error log: </em></p>";

                $.unique(result.errorMessage);//去除重复错误
                $.each(result.errorMessage, function (i, value) {
                    var $value = value;
                    if(result.osType =="Windows_NT"){
                        $value = value.replace(/\//g,'\\');
                    }
                    $errorMessage += "<p>"+ $value +"</p>"
                });

                $errorMessage += "</div></div>";
            }

            $.unique(result.errorFiles);//去除重复错误
            if(result.successFiles.length > 0){
                $.each(result.successFiles, function (i, value) {
                    var $value = value;

                    if(result.osType =="Windows_NT"){
                        $value = value.replace(/\//g,'\\');
                    }

                    //此处由于是提单路径所以引用绝对路径，所以不使用$value
                    $copyContent += $releaseUrl + value + '\n';
                    $releasePath += '<p>'+$releaseUrl + value + '</p>';
                    $testPath += '<a data-href="' + $testUrl + value + '">' + $testUrl + value + '</a>';

                    if(result.errorFiles.length > 0){
                        $.each(result.errorFiles, function (i, errorValue) {

                            if(errorValue !== undefined){
                                if(result.osType =="Windows_NT"){
                                    var $errorValue = errorValue.replace(/\//g,'\\');
                                }else{
                                    var $errorValue = errorValue;
                                }

                                $DestPath += '<a class="red" data-href="' + $UserDest + $errorValue + '">' + $UserDest + $errorValue + '</a>';

                                //完成后删除数组
                                result.errorFiles.splice(i,1);
                            }
                        });
                    }

                    //处理成功文件
                    $DestPath += '<a data-href="' + $UserDest + value + '">' + $UserDest + value + '</a>';
                });
            }else{
                $.each(result.errorFiles, function (i, errorValue) {
                    if(result.osType =="Windows_NT"){
                        var $errorValue = errorValue.replace(/\//g,'\\');
                    }else{
                        var $errorValue = errorValue;
                    }

                    $releasePath += '<p class="red">' + $releaseUrl + errorValue + '</p>';
                    $testPath += '<p class="red">' + $testUrl + errorValue + '</p>';
                    $DestPath += '<a class="red" data-href="' + $UserDest + $errorValue + '">' + $UserDest + $errorValue + '</a>';
                });
            }

            if(pathType =="local"){
                $releasePath ='';
                $testPath = '';
                $DestPath += '</div></div>';
            }else{
                $releasePath += '</div><a href="javascript:void(0)" class="copy-btn"><i class="copy-icon"></i>复制</a><div class="copy-tips"><i class="success-icon"></i>复制成功</div><textarea type="text" id="copy1" class="copy-input"></textarea></div>'
                if($testUrl==""){
                    $testPath="";
                }else{
                    $testPath += '</div></div>'
                }
                $DestPath = '';
            }

            //隐藏提示
            $(".drop-tips").hide();

            //输出到客户端
            $fileBox.append('<div class="logs-wrap"><p class="time">'+ $currentDate +'</p><div class="logs">'+$testPath+ $releasePath + $DestPath + $errorMessage +'</div></div>')

            //输出提单复制路径到input.hidden
            if($releasePath != ""){
                $fileBox.children(".logs-wrap").last().find(".copy-input").val($copyContent);
            }
        }

        //判断返回状态
        if (result.status===true && result.ftpSuccess===true) {
            if($ftpSwitch === true){
                PathExport("network");
            }else{
                PathExport("local");
            }
        } else if(result.ftpSuccess === false) {
            $(".drop-tips").hide();
            $fileBox.append('<div class="logs-wrap"><p class="time">'+ $currentDate +'</p><div class="logs"><p class="red">FTP链接失败，请检查FTP服务器是否能正常链接或者检查FTP配置是否正确</p>');
        }else{
            alert(result.errorMessage);
        }
    }

    //TODO 初始化拖拽上传组件
    exports.initDmUploader = function(updateCssSprite) {
        var $fileBox = $("#drag-and-drop-zone");
        var $repeatfiles = [];
        var $repeatfilesType = [];

        $fileBox.click(function (event) {
            event.preventDefault();
        });

        $dmuploader(updateCssSprite,$fileBox,{
            url: '/tools/doUploader',
            dataType: 'json',
            allowedTypes: '*',
            onInit: function () {
                console.log('init success!');
            },
            onBeforeUpload: function (id) {

            },
            onNewFile: function (id, file) {
                //console.log("onNewFile~");
            },
            onComplete: function () {
                //console.log('onComplete!!');
            },
            onUploadProgress: function (id, percent) {
                //            console.log("onUploadProgress: ");
                //            console.log(percent);
            },
            onUploadSuccess: function (id, result) {
                //更新上一次上传文件数组
                $repeatfiles = result.repeatFiles;
                $repeatfilesType = result.repeatfilesType;

                //成功函数初始化
                uploadAjaxSuccess(result);

            },
            onUploadError: function (id, message) {
                $("#loadding-box").hide();
                alert("系统出错，请重启软件！");
            },
            onFileTypeError: function (file) {
                $("#loadding-box").hide();
                alert('上传文件格式不对，请上传css文件!');
            }
        });

        //TODO F5 提交上次上传文件
        var repeatLastfiles = function (event) {
            var $panelBox = $("input[name='panelBox']").val();

            if($panelBox =="0") {
                //我们可以用jQuery的event.timeStamp来标记时间，这样每次的keyup事件都会修改lastTime的值，lastTime必需是全局变量
                lastTime = event.timeStamp;
                setTimeout(function () {
                    //如果时间差为0，也就是你停止输入0.5s之内都没有其它的keyup事件产生，这个时候就可以去请求服务器了
                    if (lastTime - event.timeStamp == 0) {
                        /*
                         在这里可以执行ajax请求
                         */

                        if (event.keyCode == "112") {
                            gui.Shell.openExternal("http://km.oa.com/group/26630/articles");
                        }

                        if (event.keyCode == "116" || event.which == 1) {
                            if ($repeatfiles.length > 0) {
                                //获取各个任务的开关
                                var $itemsIndex = $("input[name='itemsIndex']").val();
                                var $ftpSwitch = $("input[name='ftpSwitch']").prop("checked");
                                var $imgSwitch = $("input[name='imgSwitch']:checked").val();
                                var $pxToRemSwitch = $("input[name='pxToRemSwitch']").prop("checked");

                                var formdata = new FormData();
                                formdata.append("filesUrl", $repeatfiles);
                                formdata.append("filesType", $repeatfilesType);
                                formdata.append("ftpSwitch", $ftpSwitch);
                                formdata.append("tinyImgSwitch", $imgSwitch);
                                formdata.append("itemsIndex", $itemsIndex);
                                formdata.append("pxToRemSwitch", $pxToRemSwitch);

                                //显示loading
                                $("#loadding-box").show();

                                // Ajax Submit
                                $.ajax({
                                    url: "/tools/doUploader",
                                    type: "post",
                                    dataType: "json",
                                    data: formdata,
                                    cache: false,
                                    contentType: false,
                                    processData: false,
                                    forceSync: false,
                                    success: function (data) {
                                        uploadAjaxSuccess(data);
                                    },
                                    error: function (errMsg) {
                                        $("#loadding-box").hide();
                                        alert("系统出错，请重启软件！");
                                    },
                                    complete: function (xhr, textStatus) {

                                        $("#drag-and-drop-zone").scrollTop($("#drag-and-drop-zone")[0].scrollHeight);

                                    }
                                });
                            }
                        }
                    }
                }, 300);
            }
        };


        $("body").keyup(function (event) {
            var lastTime;
            repeatLastfiles(event);
        });

        $("#repeatLastfiles").click(function(event){
            var lastTime;
            repeatLastfiles(event);
        });
    };
});