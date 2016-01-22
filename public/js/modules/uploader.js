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
        var $ftpSwitch = $("input[name='ftpSwitch']:checked").val();

        //隐藏loading
        $("#loadding-box").hide();

        //提交时间更新
        var myDate = new Date();
        var $currentDate = myDate.getHours() + ':' + myDate.getMinutes() + ':' + myDate.getSeconds();

        if (result.status===true && result.ftpSuccess===true) {
            var $copyContent = '';
            var $testUrl = result.testPath;
            var $releaseUrl = result.releasePath;

            if($ftpSwitch == "true"){
                var $releasePath = "<div class='logs-box'><h3 class='releasePath'>提单路径</h3><div class='logs-text-box'>";
                var $testPath = "<div class='logs-box'><h3>测试地址</h3><div class='logs-text-box'>";

                var $errorMessage="";
                if (result.errorMessage.length > 0) {
                    $errorMessage = "<p><em style='color:#06c'>error log: </em>" + result.errorMessage + "</p>";
                }

                $.each(result.successFiles, function (i, value) {
                    $releasePath += $releaseUrl + value + '\n';
                    $copyContent += $releaseUrl + value + '\n';

                    $testPath += "<a data-href='" + $testUrl + value + "'>" + $testUrl + value + "</a>";
                });

                $.each(result.errorFiles, function (i, value) {
                    $releasePath += '<p class="red">' + $releaseUrl + value + '</p>';
                    $testPath += '<p class="red">' + $testUrl + value + '</p>';
                });

                $releasePath += '</div><a href="javascript:void(0)" class="copy-btn"><i class="copy-icon"></i>复制</a><div class="copy-tips"><i class="success-icon"></i>复制成功</div><textarea type="text" id="copy1" class="copy-input"></textarea></div>'
                $testPath += '</div></div>'


                //隐藏提示
                $(".drop-tips").hide();

                if($testUrl==""){
                    $testPath="";
                }

                //输出到客户端
                $fileBox.append('<div class="logs-wrap"><p class="time">'+ $currentDate +'</p><div class="logs">'+$testPath+ $releasePath + $errorMessage +'</div></div>')

                //输出提单复制路径到input.hidden
                $fileBox.children(".logs-wrap").last().find(".copy-input").val($copyContent);
            }else{

                var $DestPath = "<div class='logs-box'><h3 class='releasePath'>临时目录文件列表</h3><div class='logs-text-box'>";
                var $UserDest = result.destPath;

                $.each(result.successFiles, function (i, value) {
                    var $value = value.replace(/\//g,'\\');

                    console.log($value);

                    $DestPath += "<a data-href='" + $UserDest + $value + "'>" + $UserDest + $value + "</a>";
                });

                $DestPath += '</div></div>'
                //输出到客户端
                $fileBox.append('<div class="logs-wrap"><p class="time">'+ $currentDate +'</p><div class="logs">'+ $DestPath +'</div></div>')

            }
        } else if(result.ftpSuccess === false) {
            $(".drop-tips").hide();
            $fileBox.append('<div class="logs-wrap"><p class="time">'+ $currentDate +'</p><div class="logs"><p class="red">FTP链接失败，请检查FTP服务器是否能正常链接或者检查FTP配置是否正确</p>');
        }else{
            alert('请上传本地目录下的文件！');
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
            url: 'http://localhost:3030/tools/doUploader',
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
                                var $ftpSwitch = $("input[name='ftpSwitch']:checked").val();
                                var $imgSwitch = $("input[name='imgSwitch']:checked").val();
                                var $itemsIndex = $("input[name='itemsIndex']").val();

                                var formdata = new FormData();
                                formdata.append("filesUrl", $repeatfiles);
                                formdata.append("filesType", $repeatfilesType);
                                formdata.append("ftpSwitch", $ftpSwitch);
                                formdata.append("tinyImgSwitch", $imgSwitch);
                                formdata.append("itemsIndex", $itemsIndex);

                                //显示loading
                                $("#loadding-box").show();

                                // Ajax Submit
                                $.ajax({
                                    url: "http://localhost:3030/tools/doUploader",
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