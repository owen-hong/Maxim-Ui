//变量定义
var fs = require('fs');
var path = require('path');
var async = require('async');
var CssCleaner = require('clean-css');
var common = require('./common.js');

function Mincss(){
}
Mincss.prototype = {
    minCsses : function(csses,config,callback){
        //csses预处理
        if(typeof  csses === 'string'){
            var tmp = csses;
            csses = [];
            csses.push(tmp);
        }
        var plat = common.getCurrentPlat();
        var split = plat.split;

        var results = [];
        var count = csses.length;
        var funcs = [];

        //处理config中路径的配置如果不以\结尾，则要加上
        config.destPath = config.destPath[config.destPath.length -1] === path.sep ? config.destPath : config.destPath + path.sep;
        config.localPath = config.localPath[config.localPath.length -1] === path.sep ? config.localPath : config.localPath + path.sep;

        for(var i = 0 ; i < count ;i++){
            funcs.push(getCssMinFunc(i));
        }
        function getCssMinFunc(n){
            return function(callback){
                //保存索引
                var i = n;
                //判断文件是否在指定的源目录下
                if(csses[i].indexOf(config.localPath) < 0){
                    callback(null,{
                        fName : csses[i],
                        status : false,
                        message : 'The operated file is not in the path which is defined in config file'
                    });
                }else{
                    fs.readFile(csses[i],function(err,data){
                        var f_name = path.basename(csses[i]);
                        if(err){
                            callback(null,{
                                fName : csses[i].replace(config.localPath,'').replace(/\\/g,'\/'),
                                status : false,
                                message : err.message
                            });
                        }else{
                            //将源文件的根目录替换为目标目录的根目录
                            var dest = csses[i].replace(config.localPath,config.destPath);
                            //获取文件的父目录
                            var f_Path = dest.replace(f_name,'');
                            //判断目录是否存在，不存在则创建目
                            if (!fs.existsSync(f_Path)) {
                                //因为node不支持多级目录同时创建，因此得调用自己的api去逐级建立目录
                                common.createPath(f_Path,fs);
                            }
                            //写文件到指定位置
                            //minify可以传递文件流buffer，也可以是文件读取出来的字符串
                            //直接将样式文件所在的目录确定为根目录，因为对于clean-css而言，它寻找样式文件的基准是这里
                            var r_path = csses[i].replace(split+f_name,'');
                            /*
                             relativeTo和root来处理import rule
                             rebase设置为false，是告诉引擎不要处理样式中路径的计算
                             keepSpecialComments : 0 ，删除所有注释
                             * */
                            fs.writeFile(dest,new CssCleaner({
                                keepSpecialComments : 0,
                                aggressiveMerging : false,
                                restructuring : false,//避免属性合并带来的结构重组，这里禁止进行属性合并，且更改原有结构
                                keepBreaks : true,
                                relativeTo :r_path,
                                root : '',//对相对路径进行处理时，这个设置为空字符串则只是相对于当前文件所在目录来进行路径resolve
                                rebase : true//对图片路径进行处理
                            }).minify(data).styles,function(err){
                                if(err){
                                    callback(null,{
                                        //如果是windows下的斜杠则进行转换
                                        fName : csses[i].replace(config.localPath,'').replace(/\\/g,'\/'),
                                        status : false,
                                        message : err.message
                                    });
                                }else{
                                    callback(null,{
                                        fName : csses[i].replace(config.localPath,'').replace(/\\/g,'\/'),
                                        status : true
                                    });
                                }
                            });
                        }
                    });
                }
            };
        }
        //异步顺序
        async.parallel(funcs,function(err,results){
            callback(results);
        });
    }
};
module.exports = Mincss;