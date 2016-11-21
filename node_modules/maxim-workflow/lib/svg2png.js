/**
 * Created by owenhong on 2016/9/18.
 */

'use strict';

var path	   = require('path'),
    pn		   = require('pn/fs'),
    fse		   = require('fs-extra'),
    svg2png = require("svg2png");

var modifySvg = require('./modify-svg');

function svgToPng(){}
svgToPng.prototype.init = function(files,config,callback){
    var results = [];
    var index = files.length;
    files.forEach(function(file){

        let relativeFile = file.replace(config.destPath, '').replace(config.localPath, '');
        let svgDest = path.join(config.destPath,relativeFile);


        //获取url参数
        var getParam = function(url, id) {
            var url = url+ "";
            var regstr = "/(\\?|\\&)" + id + "=([^\\&]+)/";
            var reg = eval(regstr);//eval可以将 regstr字符串转换为 正则表达式
            var result = url.match(reg);//匹配的结果是：result[0]=?sid=22 result[1]=sid result[2]=22。所以下面我们返回result[2]

            if (result && result[2]) {
                var url = result.input.substring(0,result.index);
                return [result[2],url];
            }
        }

        var svgFill = getParam(file, 'fill');

        var svg2pngStart = function(filePath,flag) {
            pn.readFile(filePath)
                .then(svg2png)
                .then(function (buffer) {
                    var basename = path.basename(filePath, '.svg');
                    if(flag){
                        var dirname = (path.dirname(filePath) + path.sep);
                    }else{
                        var dirname = (path.dirname(filePath) + path.sep).replace(config.localPath, config.destPath);
                    }

                    var svgPngDest = dirname + basename + '.png'
                    fse.outputFile(svgPngDest, buffer, function (err) {
                        if (err) {
                            results.push({
                                status: false,
                                fName: svgPngDest.replace(config.destPath, '').replace(config.localPath, '').replace(/\\/g, '\/'),
                                message: err.message
                            });

                            index--;
                            if (index <= 0) {
                                callback(null, results);
                            }
                            return;
                        }

                        //SVG TO PNG文件输出
                        results.push({
                            status: true,
                            fName: svgPngDest.replace(config.destPath, '').replace(config.localPath, '').replace(/\\/g, '\/'),
                        });

                        if(flag){
                            //SVG文件输出
                            results.push({
                                status: true,
                                color:svgFill[0],
                                baseName:path.basename(file),
                                fName: filePath.replace(config.destPath, '').replace(config.localPath, '').replace(/\\/g, '\/'),
                            });

                            index--;
                            if (index <= 0) {
                                callback(null, results);
                            }
                        }else{
                            fse.readFile(filePath, function (err, buffer) {
                                if (err) {
                                    //SVG文件输出
                                    results.push({
                                        status: false,
                                        fName: filePath.replace(config.destPath, '').replace(config.localPath, '').replace(/\\/g, '\/'),
                                        message: err.message
                                    });

                                    index--;
                                    if (index <= 0) {
                                        callback(null, results);
                                    }
                                    return;
                                }

                                fse.outputFile(svgDest, buffer, function (err) {
                                    if (err) {
                                        //SVG文件输出失败处理
                                        results.push({
                                            status: false,
                                            fName: filePath.replace(config.destPath, '').replace(config.localPath, '').replace(/\\/g, '\/'),
                                            message: err.message
                                        });

                                        index--;
                                        if (index <= 0) {
                                            callback(null, results);
                                        }

                                        return;
                                    }

                                    //SVG文件输出
                                    results.push({
                                        status: true,
                                        fName: filePath.replace(config.destPath, '').replace(config.localPath, '').replace(/\\/g, '\/'),
                                    });

                                    index--;
                                    if (index <= 0) {
                                        callback(null, results);
                                    }
                                })
                            });
                        }
                    });
                })
                .catch(function (error) {
                    if (error.message.indexOf('Width or height could not be determined from either') >= 0) {
                        var errorMessage = new Error(file + ': ' + '此SVG文件未设定宽高,无法转换成png');
                    } else {
                        var errorMessage = new Error(file + ': ' + error.message);
                    }

                    callback(errorMessage, results);
                });
        }

        if (svgFill) {
            if (fse.existsSync(svgFill[1]) === true) {
                var fileName = path.basename(svgFill[1], '.svg') + '-' + svgFill[0] + '.svg';
                var modifySvgPath = (path.dirname(svgFill[1]) + path.sep).replace(config.localPath, config.destPath) + fileName;

                var modifySvgConfig = {
                    "color": svgFill[0],
                    "modifySvgDest": modifySvgPath
                }

                //进行modify svg 操作
                var modifySvgStatus = modifySvg.svgSprite(svgFill[1], modifySvgConfig);

                if(modifySvgStatus.status){
                    svg2pngStart(modifySvgPath,true);

                }else{
                    callback(modifySvgStatus.err,results);
                    return;
                }
            }
        }else{
            svg2pngStart(file,false);
        }
    })

}

module.exports = svgToPng;