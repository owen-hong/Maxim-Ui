/**
 * Created by owenhong on 2016/11/15.
 */

var fs = require('fs-extra');
var path = require('path');


var svgmodify = {};

svgmodify.colorize = true;


/**
 * @param {string} input - code of SVG-file
 * @returns {string} clear svg-code
 */
function clearInput(input) {
    var output = input.replace(new RegExp('([\r\n\t]|\\s{2,})', 'g'), '');

    output = output.replace(new RegExp('(<)(.*?)(xml |dtd)(.*?)(>)', 'g'), '');

    output = output.replace(new RegExp('(<g></g>)', 'g'), '');
    output = output.replace(new RegExp('(<defs></defs>)', 'g'), '');

    output = output.replace(new RegExp('((<!--)(.*?)(-->))', 'g'), '');
    output = output.replace(new RegExp('(<title>(.*?)</title>)', 'g'), '');
    output = output.replace(new RegExp('(<desc>(.*?)</desc>)', 'g'), '');

    output = output.replace(new RegExp('( sketch:type="(.*?)")', 'g'), '');
    output = output.replace(new RegExp('( id="(.*?)")', 'g'), '');

    return output;
}



/**
 * @param {string} input - SVG code
 * @returns {Object} attributes of tag 'svg'
 */
function getSVGAttrs(input) {
    var svgHeadRx = new RegExp('(<svg)(.*?)(>)', 'g');
    var svgOpenTag = svgHeadRx.exec(input)[0];
    svgOpenTag = svgOpenTag.replace(new RegExp('(<svg )|>', 'g'), '');
    var attrsSrc = svgOpenTag.split('" ');
    var attrsObj = {};

    attrsSrc.forEach(function(attrStr) {
        var attrArray = attrStr.split('=');

        var attrName = attrArray[0];
        var attrVal = attrArray[1];

        attrVal = attrVal.replace(new RegExp('["]', 'g'), '');
        attrsObj[attrName] = attrVal;
    });

    return attrsObj;
}


/**
 * @param {Object} attrsObj - old attributes of SVG-element
 * @param {Object} newAttrsObj - new attributes of SVG-element
 * @returns {Object} remapped attributes
 */
function changeAttrs(attrsObj, newAttrsObj) {

    for (var key in newAttrsObj) {
        var oldWidth, newWidth, oldHeight, newHeight;
        //console.log("bbbbbbbbbbbbbbbbbb");
        //console.log(key);

        if (key === 'width') {
            oldWidth = parseFloat(attrsObj['width']);
            newWidth = parseFloat(newAttrsObj['width']);
            oldHeight = parseFloat(attrsObj['height']);
            newHeight = newWidth / oldWidth * oldHeight;

            attrsObj['height'] = newHeight + 'px';
            attrsObj[key] = newAttrsObj[key] + 'px';
        } else if (key === 'height') {
            oldHeight = parseFloat(attrsObj['height']);
            newHeight = parseFloat(newAttrsObj['height']);

            oldWidth = parseFloat(attrsObj['width']);
            newWidth = newHeight / oldHeight * oldWidth;

            attrsObj['width'] = newWidth + 'px';
            attrsObj[key] = newAttrsObj[key] + 'px';
        }
    }
    return attrsObj;
}

/**
 * @param {string} input - Input SVG
 * @param {Object} newAttrsObj
 * @returns {string} new tag 'svg'
 */
function rebuildSvgHead(input, newAttrsObj) {
    var out = '';
    var svgKeys = ['version', 'xmlns', 'width', 'height', 'viewBox'];

    var attrsObj = getSVGAttrs(input);

    if (newAttrsObj) {
        attrsObj = changeAttrs(attrsObj, newAttrsObj);
    }

    for (var i = 0; i < svgKeys.length; i++) {
        var key = svgKeys[i];
        out += ' ' + key + '="' + attrsObj[key] + '"';
    }
    out = '<svg' + out + '>';

    return out;
}

/**
 * @param {string} input - SVG-code
 * @returns {string} content of SVG-file without tags 'svg'
 */
function getSVGBody(input) {
    return input.replace(new RegExp('(<svg|</svg)(.*?)(>)', 'g'), '');
}

/**
 * @param {string} input - Input SVG
 * @param {Object} config - parameters for modifying SVG
 * @returns {string} colored svg
 */
function changeColor(input, config) {
    var out = input;
    var shapeColor = config.color; // set default color
    var hasFill = input.indexOf('g fill') <= 0;
    var colorize = config['colorize'];

    if (colorize === false || svgmodify.colorize === false) {
        return out;
    }

    if (config && shapeColor) {
        shapeColor = config.color;
    }

    if (shapeColor && hasFill) {
        out = input.replace(new RegExp('(fill=")(.*?)(")', 'g'), 'fill="' + shapeColor + '"').replace(new RegExp('(fill:)(.*?)(;)', 'g'), 'fill:' + shapeColor + ';');
    }

    return out;
}


/**
 * @param {string} filePath - input path
 * @param {Object} config - params to replace in file
 * @returns {string} svg with new sizes and color
 */
var modifySvg = {}

modifySvg.svgSprite = function(filePath,config){
    try {
        var input = fs.readFileSync(filePath).toString();
        var out = input;
        var svgTail = '</svg>';

        input = clearInput(input);

        if (config || config.color) {

            var svgHead = rebuildSvgHead(input, config);
            var svgBody = getSVGBody(input);
            svgBody = changeColor(svgBody, config);

            out = svgHead + svgBody + svgTail;
        }

        var fileName = path.basename(filePath, '.svg'),
            fileNameExt = path.basename(filePath);

        fs.outputFileSync(config.modifySvgDest,out);

    }catch (err){
        return {
            status:false,
            err:err
        }
    }

    return {
        status:true
    }
}

modifySvg.changeSize = function(filePath,config,cb){
    try {
        var input = fs.readFileSync(filePath).toString();
        var out = input;
        var svgTail = '</svg>';

        input = clearInput(input);

        if (config || config.color) {

            var svgHead = rebuildSvgHead(input, config);
            var svgBody = getSVGBody(input);
            svgBody = changeColor(svgBody, config);

            out = svgHead + svgBody + svgTail;
        }

        var fileName = path.basename(filePath, '.svg'),
            fileNameExt = path.basename(filePath);

        fs.outputFileSync(config.modifySvgDest,out);

        cb({
            status:true,
            destPath:config.modifySvgDest
        });

    }catch (err){
        cb({
            status:false,
            err:err
        });
    }
}

module.exports = modifySvg;