/**
 * Created by owenhong on 2016/1/15.
 *
 *
 */

define(function(require, exports, module) {
    let init = function(fn){
        let copySelectionText = function () {
            let copysuccess // var to check whether execCommand successfully executed
            try {
                copysuccess = document.execCommand("copy") // run command to copy selected text to clipboard
            } catch (e) {
                copysuccess = false
            }
            return copysuccess
        }

        $.fn.copyText = function (start, end, fn) {
            let e = $(this)[0];

            if (!e) return;

            else if (e.setSelectionRange) {
                e.focus();
                e.setSelectionRange(start, end);
            } /* WebKit */
            else if (e.createTextRange) {
                let range = e.createTextRange();
                range.collapse(true);
                range.moveEnd('character', end);
                range.moveStart('character', start);
                range.select();
            } /* IE */
            else if (e.selectionStart) {
                e.selectionStart = start;
                e.selectionEnd = end;
            }

            let copysuccess = copySelectionText();
            if (copysuccess) {
                fn();
            }
        };
    }

    exports.init = init;
});