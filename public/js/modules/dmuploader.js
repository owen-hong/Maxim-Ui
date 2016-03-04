/**
 * Created by owenhong on 2015/12/24.
 */
/*
 * dmuploader.js - Jquery File Uploader - 0.1
 * http://www.daniel.com.uy/projects/jquery-file-uploader/
 *
 * Copyright (c) 2013 Daniel Morales
 * Dual licensed under the MIT and GPL licenses.
 * http://www.daniel.com.uy/doc/license/
 */

define(function(requires, exports, module) {
    //return function ($) {
        var pluginName = 'dmUploader';

        // These are the plugin defaults values
        var defaults = {
            url: document.URL,
            method: 'POST',
            extraData: {},
            maxFileSize: 0,
            maxFiles: 0,
            allowedTypes: '*',
            extFilter: null,
            dataType: null,
            fileName: 'file',
            onInit: function () {
            },
            onFallbackMode: function () {
                message
            },
            onNewFile: function (id, file) {
            },
            onBeforeUpload: function (id) {
            },
            onComplete: function () {
            },
            onUploadProgress: function (id, percent) {
            },
            onUploadSuccess: function (id, data) {
            },
            onUploadError: function (id, message) {
            },
            onFileTypeError: function (file) {
            },
            onFileSizeError: function (file) {
            },
            onFileExtError: function (file) {
            },
            onFilesMaxError: function (file) {
            }
        };


        var DmUploader = function (updateCssSprite,element, options) {

            this.element = element;
            this.updateCssSprite = updateCssSprite;

            this.settings = $.extend({}, defaults, options);

            if (!this.checkBrowser()) {
                return false;
            }

            this.init();

            return true;
        };

        DmUploader.prototype.checkBrowser = function () {
            if (window.FormData === undefined) {
                this.settings.onFallbackMode.call(this.element, 'Browser doesn\'t support Form API');

                return false;
            }

            if (this.element.find('input[type=file]').length > 0) {
                return true;
            }

            if (!this.checkEvent('drop', this.element) || !this.checkEvent('dragstart', this.element)) {
                this.settings.onFallbackMode.call(this.element, 'Browser doesn\'t support Ajax Drag and Drop');

                return false;
            }

            return true;
        };

        DmUploader.prototype.checkEvent = function (eventName, element) {
            var element = element || document.createElement('div');
            var eventName = 'on' + eventName;

            var isSupported = eventName in element;

            if (!isSupported) {
                if (!element.setAttribute) {
                    element = document.createElement('div');
                }
                if (element.setAttribute && element.removeAttribute) {
                    element.setAttribute(eventName, '');
                    isSupported = typeof element[eventName] == 'function';

                    if (typeof element[eventName] != 'undefined') {
                        element[eventName] = undefined;
                    }
                    element.removeAttribute(eventName);
                }
            }

            element = null;
            return isSupported;
        };

        DmUploader.prototype.init = function () {
            var widget = this;

            widget.queue = new Array();
            widget.queuePos = -1;
            widget.queueRunning = false;

            // -- Drag and drop event
            widget.element.on('drop', function (evt) {
                evt.preventDefault();
                var files = evt.originalEvent.dataTransfer.files;

                widget.queueFiles(files);
            });

            //-- Optional File input to make a clickable area
            $("#multipleFile").on('change', function (evt) {
                var files = evt.target.files;

                widget.queueFiles(files);

                $(this).val('');
            });

            this.settings.onInit.call(this.element);
        };


        DmUploader.prototype.queueFiles = function (files) {
            var j = this.queue.length;

            var $filesPath = [];
            var $filesType = [];
            for (var i = 0; i < files.length; i++) {

                var file = files[i];

                $filesType.push(file.type);
                this.settings.extraData.filesType = $filesType;


                //TODO 路径传入
                $filesPath.push(file.path);
                this.settings.extraData.filesUrl = $filesPath;

                // Check file size
                if ((this.settings.maxFileSize > 0) &&
                    (file.size > this.settings.maxFileSize)) {

                    this.settings.onFileSizeError.call(this.element, file);

                    continue;
                }

                // Check file type
                if ((this.settings.allowedTypes != '*') && !file.type.match(this.settings.allowedTypes)) {

                    this.settings.onFileTypeError.call(this.element, file);

                    continue;
                }

                // Check file extension
                if (this.settings.extFilter != null) {
                    var extList = this.settings.extFilter.toLowerCase().split(';');

                    var ext = file.name.toLowerCase().split('.').pop();

                    if ($.inArray(ext, extList) < 0) {
                        this.settings.onFileExtError.call(this.element, file);

                        continue;
                    }
                }

                // Check max files
                if (this.settings.maxFiles > 0) {
                    if (this.queue.length >= this.settings.maxFiles) {
                        this.settings.onFilesMaxError.call(this.element, file);

                        continue;
                    }
                }

                this.queue.push(file);

                var index = this.queue.length - 1;

                this.settings.onNewFile.call(this.element, index, file);
            }

            // Only start Queue if we haven't!
            //if (this.queueRunning) {
            //    return false;
            //}

            // and only if new Failes were successfully added
            //if (this.queue.length == j) {
            //    return false;
            //}
            var $this = this;
            var isMac = (navigator.platform == "Mac68K") || (navigator.platform == "MacPPC") || (navigator.platform == "Macintosh") || (navigator.platform == "MacIntel");
            if(isMac){
                var $DialogConfig = {
                    frame:true,
                    position: 'center',
                    height:500,
                    width:640
                }
            }else{
                var $DialogConfig = {
                    frame:false,
                    position: 'center',
                    height:500,
                    width:640
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

            //判断是否项目为空
            var $menuListSite = $(".menu-list li").size();
            if($menuListSite <= 0){
                alert("请先配置你的项目");
                gui.Window.open('http://localhost:3030/addProject?itemsIndex=' + $menuListSite,{
                    frame:$DialogConfig.frame,
                    position: $DialogConfig.position,
                    width:$DialogConfig.width,
                    height: $DialogConfig.height,
                    focus:true,
                    id:"addProjectWin"
                },function(new_win){

                    setAlwaysOnTop(new_win);

                    new_win.on('close', function () {
                        new_win.hide(); // PRETEND TO BE CLOSED ALREADY
                        $this.updateCssSprite(true,$menuListSite);
                        new_win.close(true);//防止进程没被杀死
                    });
                });
                return false;
            }


            //判断FTP是否开启，开启就做FTP配置校验，未开启就弹出FTP配置让用户完善
            var $ftpSwitch = $("input[name='ftpSwitch']").prop("checked");
            var $itemsIndex = $("input[name='itemsIndex']").val();
            if($ftpSwitch === true){
                $.get("/validateFtp?itemsIndex="+$itemsIndex).done(function(data){
                    if(data.ftpNull===false){
                        $("#loadding-box").show();
                        $this.processQueue();
                    }else{
                        alert("请完善FTP配置.");
                        gui.Window.open('http://localhost:3030/editProject?itemsIndex=' + $itemsIndex, {
                            frame: $DialogConfig.frame,
                            position: $DialogConfig.position,
                            width: $DialogConfig.width,
                            height: $DialogConfig.height,
                            focus: true,
                            id:"editProjectWin"
                        },function(new_win){
                            setAlwaysOnTop(new_win);

                            new_win.on('close', function () {
                                new_win.hide(); // PRETEND TO BE CLOSED ALREADY
                                $this.updateCssSprite(false,$itemsIndex);
                                new_win.close(true);//防止进程没被杀死
                            });
                        });
                        return false;
                    }
                });
            }else{
                $("#loadding-box").show();
                $this.processQueue();
            }
            return true;
        };

        DmUploader.prototype.processQueue = function () {
            var widget = this;

            widget.queuePos++;

            if (widget.queuePos >= widget.queue.length) {
                // Cleanup

                widget.settings.onComplete.call(widget.element);

                // Wait until new files are droped
                widget.queuePos = (widget.queue.length - 1);

                widget.queueRunning = false;

                return;
            }

            var file = widget.queue[widget.queuePos];

            // Form Data
            var fd = new FormData();

            fd.append(widget.settings.fileName, file);

            // Return from client function (default === undefined)
            var can_continue = widget.settings.onBeforeUpload.call(widget.element, widget.queuePos);

            // If the client function doesn't return FALSE then continue
            if (false === can_continue) {
                return;
            }

            //获取各个任务的开关
            var $ftpSwitch = $("input[name='ftpSwitch']").prop("checked");
            var $imgSwitch = $("input[name='imgSwitch']:checked").val();

            var $itemsIndex = $("input[name='itemsIndex']").val();

            var $pxToRemSwitch = $("input[name='pxToRemSwitch']").prop("checked");



            widget.settings.extraData.ftpSwitch = $ftpSwitch;
            widget.settings.extraData.tinyImgSwitch = $imgSwitch;

            widget.settings.extraData.itemsIndex = $itemsIndex;

            widget.settings.extraData.pxToRemSwitch = $pxToRemSwitch;


            $.each(widget.settings.extraData, function (exKey, exVal) {
                fd.append(exKey, exVal);
            });

            widget.queueRunning = true;

            // Ajax Submit
            $.ajax({
                url: widget.settings.url,
                type: widget.settings.method,
                dataType: widget.settings.dataType,
                data: fd,
                cache: false,
                contentType: false,
                processData: false,
                forceSync: false,
                xhr: function () {
                    var xhrobj = $.ajaxSettings.xhr();
                    if (xhrobj.upload) {
                        xhrobj.upload.addEventListener('progress', function (event) {
                            var percent = 0;
                            var position = event.loaded || event.position;
                            var total = event.total || event.totalSize;
                            if (event.lengthComputable) {
                                percent = Math.ceil(position / total * 100);
                            }

                            widget.settings.onUploadProgress.call(widget.element, widget.queuePos, percent);
                        }, false);
                    }

                    return xhrobj;
                },
                success: function (data, message, xhr) {
                    widget.settings.onUploadSuccess.call(widget.element, widget.queuePos, data);
                },
                error: function (xhr, status, errMsg) {
                    widget.settings.onUploadError.call(widget.element, widget.queuePos, errMsg);
                },
                complete: function (xhr, textStatus) {
                    $("#drag-and-drop-zone").scrollTop($("#drag-and-drop-zone")[0].scrollHeight);
                    //widget.processQueue();
                }
            });
        }


        module.exports = function(updateCssSprite,element,options){
            return new DmUploader(updateCssSprite,element,options);
        }


        //$.fn.dmUploader = function (options) {
        //    return this.each(function () {
        //        if (!$.data(this, pluginName)) {
        //            $.data(this, pluginName, new DmUploader(this, options));
        //        }
        //    });
        //};
        //
        // -- Disable Document D&D events to prevent opening the file on browser when we drop them
        $(document).on('dragenter', function (e) {
            e.stopPropagation();
            e.preventDefault();
        });
        $(document).on('dragover', function (e) {
            e.stopPropagation();
            e.preventDefault();
        });
        $(document).on('drop', function (e) {
            e.stopPropagation();
            e.preventDefault();
        });

    //}
});