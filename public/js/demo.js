(function ($, window, undefined) {
    $.danidemo = $.extend({}, {
        addLog: function (id, status, str) {
            var d = new Date();
            var li = $('<li />', {'class': 'demo-' + status});

            var message = '[' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + '] ';

            message += str;

            li.html(message);

            $(id).prepend(li);
        },
        addFile: function (id, i, file) {

            if (!$("#demo-files li").size()) {
                $("#demo-files").addClass("results-list");
            }
            var template = '<li id="rem-file' + i + '">' +
                '<div class="before">' +
                '<span class="size">' + $.danidemo.humanizeSize(file.size) + '</span>' + file.name +
                '</div>' +
                '<div class="progress-box">' +
                '<div class="progress">' +
                '<div class="progress-bar progress-bar-striped active" role="progressbar" style="width:100%">' +
                '<span class="sr-only">0% Transforming</span>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '<div class="after">' +
                '<span class="size"></span>' +
                '<a target="_blank"href="#">download</a>' +
                '</div>' +
                '</li>';

            var i = $(id).attr('file-counter');
            if (!i) {
                $(id).empty();
                i = 0;
            }
            i++;

            $(id).attr('file-counter', i);
            $(id).prepend(template);
        },
        updateFileStatus: function (i, status, message) {
            $('#rem-file' + i).find('span.demo-file-status').html(message).addClass('demo-file-status-' + status);
        },
        updateFileProgress: function (i, percent) {
            if (percent != "0%") {
                $('#rem-file' + i).find('div.progress-bar').width(percent).addClass('progress-bar-success');
                $('#rem-file' + i).find('span.sr-only').html(percent + ' Complete')
            }
        },
        humanizeSize: function (size) {
            var i = Math.floor(Math.log(size) / Math.log(1024));
            return ( size / Math.pow(1024, i) ).toFixed(2) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
        }
    }, $.danidemo);
})(jQuery, this);

