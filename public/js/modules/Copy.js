/**
 * Created by owenhong on 2016/1/15.
 */
define(function(require, exports, module) {
    var copySelectionText = function () {
        var copysuccess // var to check whether execCommand successfully executed
        try {
            copysuccess = document.execCommand("copy") // run command to copy selected text to clipboard
        } catch (e) {
            copysuccess = false
        }
        return copysuccess
    }


    $.fn.selectRange = function (start, end) {
        var e = $(this)[0];
        if (!e) return;
        else if (e.setSelectionRange) {
            e.focus();
            e.setSelectionRange(start, end);
        } /* WebKit */
        else if (e.createTextRange) {
            var range = e.createTextRange();
            range.collapse(true);
            range.moveEnd('character', end);
            range.moveStart('character', start);
            range.select();
        } /* IE */
        else if (e.selectionStart) {
            e.selectionStart = start;
            e.selectionEnd = end;
        }
    };


    var init = function(){
        $("body").on("click", ".copy-btn", function () {
            var $copyInput = $(this).siblings(".copy-input");
            $copyInput.selectRange(0, $copyInput.val().length);
            var copysuccess = copySelectionText();
            if (copysuccess) {
                $(this).siblings(".copy-tips").css("display", "inline-block").fadeOut(1500);
            }
        });
    }

    exports.init = init;
});