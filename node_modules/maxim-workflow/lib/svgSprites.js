var SVGSpriter = require('svg-sprite'),
    path	   = require('path'),
    mkdirp	   = require('mkdirp'),
    fs         = require('fs'),
    fse        = require('fs-extra'),
    svg2png = require("svg2png");


var modifySvg = require('./modify-svg');


function svgSprites(){}
svgSprites.prototype.init = function(files,svgSpriteDest,config,callback){
    var spriter	= new SVGSpriter({
        dest: svgSpriteDest || "",
        log	: false, //'info', 'verbose' or 'debug'
        shape : {
            spacing             : {                         // Spacing related options
                padding         : 1,                        // Padding around all shapes
                box             : 'content'                 // Padding strategy (similar to CSS `box-sizing`)
            },
        }
    });

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

    /**
     * Add a bunch of SVG files
     *
     * @param {SVGSpriter} spriter		Spriter instance
     * @param {Array} files				SVG files
     * @return {SVGSpriter}				Spriter instance
     */
    function addFixtureFiles(spriter, files) {
        files.forEach(function (file) {
            var svgFill = getParam(file, 'fill');
            if (svgFill) {
                if (fs.existsSync(svgFill[1]) === true) {
                    var fileName = path.basename(svgFill[1], '.svg') + '-' + svgFill[0] + '.svg';
                    var modifySvgPath = (path.dirname(svgFill[1]) + path.sep).replace(config.localPath, config.destPath) + fileName;

                    var modifySvgConfig = {
                        "color": svgFill[0],
                        "modifySvgDest": modifySvgPath
                    }

                    //进行modify svg 操作
                    var modifySvgStatus = modifySvg.svgSprite(svgFill[1], modifySvgConfig);

                    if(modifySvgStatus.status){
                        spriter.add(
                            path.resolve(path.join(modifySvgPath)),
                            path.basename(modifySvgPath),
                            fs.readFileSync(path.join(modifySvgPath), {encoding: 'utf-8'})
                        );
                    }else{
                        callback(modifySvgStatus.err,{});
                        return;
                    }
                }
            } else {
                if (fs.existsSync(file) === true) {
                    spriter.add(
                        path.resolve(path.join(file)),
                        path.basename(file),
                        fs.readFileSync(path.join(file), {encoding: 'utf-8'})
                    );
                } else {
                    var err = new Error('ENOENT: no such file or directory, stat: ' + file);
                    callback(err,{});
                    return;
                }
            }
        });
        return spriter;
    }

    //执行
    addFixtureFiles(spriter, files).compile({
        css						: {
            //sprite				: 'svg/sprite.svg',
            layout				: 'packed',
            dimensions			: true,
            render				: {
                css				: false
            }
        }
    }, function(error, result, cssData) {
        var results = {};

        if(error){
            callback(error,results);
        }

        var ret = [];
        cssData.css.shapes.forEach(function(data,i){
            files.forEach(function(filesData){
                var svgFill = getParam(filesData, 'fill');

                if(svgFill) {
                    var fileName = path.basename(svgFill[1], '.svg') + '-' + svgFill[0] + '.svg';
                    var modifySvgPath = (path.dirname(svgFill[1]) + path.sep).replace(config.localPath, config.destPath) + fileName;

                    fse.removeSync(modifySvgPath) //合并后删除生成的改色后的单张svg

                    if(modifySvgPath.indexOf(data.path) >= 0){
                        //console.log('modify svg...........');
                        data.svgPath = filesData;
                        ret.push(data);
                    }
                }else{
                    if(filesData.indexOf(data.path) >= 0){
                        data.svgPath = filesData;
                        ret.push(data);
                    }
                }
            });
        });

        //输出坐标数据
        results.svgSpriteData = ret;
        results.spriteSize = cssData.css.spriteWidth + 'px ' + cssData.css.spriteHeight + 'px';
        results.spriteSizeWidth = cssData.css.spriteWidth;
        results.spriteSizeHeight = cssData.css.spriteHeight;

        for (var type in result.css) {
            mkdirp.sync(path.dirname(svgSpriteDest));

            fs.writeFile(svgSpriteDest, result.css[type].contents,function(err){
                if (err) {
                    callback(err,results);
                }

                fs.readFile(svgSpriteDest,function(err,buf){
                    if(err){
                        callback(err,results);
                    }

                    svg2png(buf, { width: cssData.css.spriteWidth, height: cssData.css.spriteHeight})
                        .then(function(pngBuf){
                            var dirname = path.dirname(svgSpriteDest) + path.sep;
                            var basename = path.basename(svgSpriteDest,'.svg');
                            var svgSpritePngDest = dirname + basename +'-svg.png'


                            fs.writeFile(svgSpritePngDest, pngBuf,function(err){
                                if (err) {
                                    callback(err,results);
                                }
                                results.svgSpriteDest = svgSpriteDest;
                                results.svgSpritePngDest = svgSpritePngDest;

                                callback(null,results);
                            })
                        })
                        .catch(function(err){
                            callback(err,results);
                        })
                });
            });
        }
    })
}

module.exports = svgSprites;