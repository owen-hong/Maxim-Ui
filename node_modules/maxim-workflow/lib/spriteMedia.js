"use strict";
var fs = require('fs'),
    path = require('path'),
    cssom = require('cssom-maxim'),
    CssCleaner = require('clean-css'),
    async = require('async'),
    Spritesmith = require('spritesmith'),
    common = require('./common.js'),
    os = require('os'),
    csslint = require('./verify.js'),
    mover = require('./mover.js'),
    svgSprites = require('./svgSprites.js'),
    svgSpriteInt = new svgSprites(),
    svg2png = require('./svg2png.js'),
    svgToPng = new svg2png();


/*
//兼容不支持includes的node版本
if(!Array.prototype.includes){
    Array.prototype.includes = function (item) {
        let _this = this;
        let len = _this.length;
        for(let i = 0 ; i < len ; i++){
            if(_this[i] === item){
                return true;
            }
        }
        return false;
    }
}
*/

function includes(arr,item) {
    let len = arr.length;
    for(let i = 0 ; i < len ; i++){
        if(arr[i] == item){
            return true;
        }
    }
    return false;
}

class Media{
    constructor(file,config,callback){
        this.file = file;
        this.data = {};

        if(config.localPath[config.localPath.length - 1] == path.sep){
            config.localPath = config.localPath.trim()
        }else{
            config.localPath = config.localPath.trim() + path.sep
        }

        if(config.destPath[config.destPath.length - 1] == path.sep){
            config.destPath = config.destPath.trim()
        }else{
            config.destPath = config.destPath.trim() + path.sep
        }



        this.config = config;
        this.callback = callback;
        //处理结果列表
        this.rets = [];
        //资源图片列表
        this.resources = [];
    }
    getOwner (){
    var host = os.hostname().toLowerCase();
    var i = host.lastIndexOf('-');
    var rtx = host.substring(0,i);
    var nowTime = new Date();
    return common.getCurrentPlat().enter
        + '#MAXIM{content:"'
        + rtx.substr(0,2)
        + rtx.substr(rtx.length-1,1)
        + nowTime.getFullYear()
        + (nowTime.getMonth() + 1 >= 9 ? nowTime.getMonth() + 1 : '0' + (nowTime.getMonth() + 1))
        + (nowTime.getDate() >= 10 ? nowTime.getDate() : '0' + nowTime.getDate())
        + (nowTime.getHours() >= 10 ? nowTime.getHours() : '0' + nowTime.getHours())
        + (nowTime.getMinutes() >= 10 ? nowTime.getMinutes() : '0' + nowTime.getMinutes())
        + (nowTime.getSeconds() >= 10 ? nowTime.getSeconds() : '0' + nowTime.getSeconds())
        + '"}';
}
    init(cb){
        //适配异步任务来设置的参数
        this.callback = cb;
        let config = this.config;
        let stat = fs.statSync(this.file);
        let callback = this.callback;
        /*
        *检测样式文件是否合法
        * */

        if(stat && stat.isFile()){
            //文件相对路径
            var r_path = path.dirname(this.file),
                fName = path.basename(this.file).replace(path.extname(this.file),'');


            //读取文件内容
            var data = fs.readFileSync(this.file).toString();
            //文件进行处理，删除注释，调整相对路径
            var content = new CssCleaner({
                keepSpecialComments : 0,
                aggressiveMerging : false,
                restructuring : false,//禁止结构合并
                keepBreaks : false,
                relativeTo : r_path,
                root : '', //根目录设计值为空串保证合并的正确
                rebase : true //相对目录进行重写
            }).minify(data).styles;


            //文件校验格式
            var $this = this;
            csslint.verifyFile(content,function(data){
                if(data.status == false){
                    console.log('error error....')
                    //文件校验失败，返回失败结果集
                    callback(null,[{
                        fName : $this.file.replace(config.localPath,'').replace(/\\/g,'\/'),
                        status : false,
                        message : data.message
                    }]);
                    return;
                }else{
                    //cssom对象
                    var om = cssom.parse(content);
                    //分析并处理cssom对象
                    var medias = $this.chargeOM(om,fName);

                    //处理media的各个节点，进行样式处理/雪碧图合并
                    $this.chargeMedias(medias,$this.file);
                }
            });
        }else{
            //文件不存在
            callback(null,[
                {
                    status : false,
                    fName : this.file.replace(config.localPath,'').replace(/\\/g,'\/'),
                    message : '文件不存在'
                }
            ]);
        }
    }
    /**
     * 根据cssom生成的对象，将样式以media区段进行划分
     * */
    chargeOM(om , fName){
        //分析后的结果数组
        let ret = [],
            defaultMedia = {
                description : 'default',
                rules : [],
                name : fName
            };
        if(om && om.cssRules.length > 0){
            //第一层样式对象
            let rootRules = om.cssRules,
                len = rootRules.length,
                j = 1,
                imgPrefix = fName + '-media';
            //遍历整个规则集合，分析出media对应的样式对象
            for(let i = 0 ; i < len ; i++){
                let item = rootRules[i];
                /**
                 * item.type = 1 ，css style ，样式对象
                 * item.type = 4 ，media style ，media对象
                 * */
                switch (item.type){
                    //css style
                    case 1 :
                        defaultMedia.rules.push({
                            selectorText : item.selectorText,
                            style : item.style
                        });
                        break;
                    //font face style
                    case 5:
                        defaultMedia.rules.push({
                            selectorText : '@font-face',
                            style : item.style
                        });
                        break;
                    //keyframe style
                    case 8 :
                        //添加动画帧
                        defaultMedia.rules.push({
                            keyName : item.name,
                            prefix : item['_vendorPrefix'] == undefined ? '' : item['_vendorPrefix'],
                            style : item.cssRules,
                            isKeyFrame : true
                        });
                        break;
                    //media style
                    case 4 :
                        let mediaRules = [],
                            cssRules = item.cssRules,
                            mrLen = cssRules.length;

                        //对cssom进行提取
                        for(let i = 0 ; i < mrLen ; i++){
                            //media query里面也可能有动画帧
                            if(cssRules[i].type == 8){
                                mediaRules.push({
                                    keyName : cssRules[i].name,
                                    prefix : cssRules[i]['_vendorPrefix'] == undefined ? '' : cssRules[i]['_vendorPrefix'],
                                    style : cssRules[i].cssRules,
                                    isKeyFrame: true
                                });
                            }else{
                                mediaRules.push({
                                    selectorText:cssRules[i].selectorText,
                                    style:cssRules[i].style
                                });
                            }
                        }
                        ret.push({
                            description : item.media[0],
                            rules : mediaRules,
                            name : imgPrefix + j
                        });
                        j++;
                        break;
                    default : break;
                }
            }
            //如果有默认样式，即非media query中的样式代码，当然大部分情况下都是有的，我们这里把整个情景统一起来
            if(defaultMedia.rules.length > 0){
                for(let i = ret.length ; i > 0 ; i--){
                    ret[i] = ret[i-1];
                }
                ret[0] = defaultMedia;
            }
            return ret;
        }
    }
    /**
     * 处理medias的内容并生成相应的雪碧图/样式
     * */
    chargeMedias(medias,fName){
        let _this = this,
            count = medias.length,
            tasks = [];

        for(let i = 0 ; i < count ; i++){
            tasks.push(_this.chargeMedia(medias[i],fName));
        }


        //处理不同的任务
        async.parallel(tasks,(err,results) => {
            //console.log(results.mediaOm);
            _this.createCss(results,fName);
        });
    }
    /**
     * 将返回结果生成样式文件
     * */
    createCss(results,fName){
        var _this = this;
        let cssContent = '';
        for(let i = 0 ; i < results.length ; i++){
            //判断该media是否有错误，如果缺少图片实际上属于全局错误
            if(results[i].status == false){
                _this.callback(null,[{
                    fName : fName.replace(_this.config.localPath,'').replace(/\\/g,'\/'),
                    status : false,
                    message : results[i].message
                }]);
                return;
            }
            let mediaHeader = results[i].mediaTitle == 'default' ? '' : '@media ' + results[i].mediaTitle + '{';
            let mediaTail = results[i].mediaTitle == 'default' ? '' : '}';

            let mediaBody = '';
            let cssoms = results[i].mediaOM;
            for(let j = 0 ; j < cssoms.length ; j++){
                let om = cssoms[j];
                let classItem = '';
                //如果是动画帧则进行另外的解析
                if(om.isKeyFrame){
                    classItem = '@' + om.prefix + 'keyframes ' + om.keyName + '{';
                    for(let i = 0 ; i < om.style.length ; i++){
                        let frame = om.style[i];
                        let frameText = frame.keyText + '{';
                        let frameStyle = frame.style;
                        for(let m = 0 ; m < frameStyle.length ; m++){
                            //看是否为多属性值
                            if(!Array.isArray(frameStyle[frameStyle[m]])){
                                if(m == frameStyle.length - 1){
                                    frameText += frameStyle[m] + ':' + frameStyle[frameStyle[m]];
                                }else{
                                    frameText += frameStyle[m] + ':' + frameStyle[frameStyle[m]] + ';';
                                }
                            }else{
                                //如果是多个属性值的话则进行遍历加上去
                                let tmp = frameStyle[frameStyle[m]],
                                    tmpCss = '';
                                for(let s = 0 ; s < tmp.length; s++){
                                    if(m == frameStyle.length - 1 && s == tmp.length - 1){
                                        tmpCss += frameStyle[m] + ':' + tmp[s];
                                    }else{
                                        tmpCss += frameStyle[m] + ':' + tmp[s] + ';';
                                    }
                                }
                                frameText += tmpCss;
                            }
                        }
                        frameText += '}'
                        classItem += frameText;
                    }
                    classItem += '}';
                }else{
                    classItem = om.selectorText + '{';
                    for(let k = 0 ; k < om.style.length ; k++){
                        let property = om.style[k];
                        let importants = om.style['_importants'];
                        if(k == om.style.length - 1){
                            if(importants[property]){
                                classItem = classItem + property + ':' + om.style[property] + ' !important';
                            }else{
                                //因为cssom目前存在同属性映射bug，涉及到整个om对象的生成改变，因此我们针对display:flex先改变
                                //classItem = classItem + property + ':' + om.style[property];
                                if(!Array.isArray(om.style[property])){
                                    classItem += property + ':' + om.style[property];
                                }else{
                                    let tmp = om.style[property];
                                    let tmpStr = '';
                                    for(let s = 0 ; s < tmp.length ; s++){
                                        if(s == tmp.length -1){
                                            tmpStr += property + ':' + tmp[s];
                                        }else{
                                            tmpStr += property + ':' + tmp[s] + ';';
                                        }
                                    }
                                    classItem += tmpStr;
                                }
                            }
                        }else{
                            if(importants[property]){
                                classItem = classItem + property + ':' + om.style[property] + ' !important;';
                            }else{
                                if(!Array.isArray(om.style[property])){
                                    classItem += property + ':' + om.style[property] + ';';
                                }else{
                                    let tmp = om.style[property];
                                    let tmpStr = '';
                                    for(let s = 0 ; s < tmp.length ; s++){
                                        tmpStr += property + ':' + tmp[s] + ';';
                                    }
                                    classItem += tmpStr;
                                }
                            }
                        }
                    }
                    classItem += '}';
                }

                mediaBody += classItem;
            }
            //如果在某个media下是混合合并的模式
            let cssTail = results[i].cssTail;
            if(cssTail && cssTail != ''){
                mediaBody += '@media only screen and (-webkit-min-device-pixel-ratio:1.25),only screen and (min-resolution:120dpi),only screen and (min-resolution:1.25dppx){' + cssTail + '}';
            }
            cssContent += mediaHeader + mediaBody + mediaTail;
        }
        //在文件后面加上修改的时间戳
        cssContent += this.getOwner();
        let targetCssFile = fName.replace(_this.config.localPath,_this.config.destPath);

        //判断是否添加样式时间戳
        if(_this.config.cssNameSwitch == 'true' || _this.config.cssNameSwitch == true){
            targetCssFile = targetCssFile.replace('.css','-' + _this.config.cssName + '.css');
        }

        //写图片文件，如果文件目录不存在则创建之
        common.createPath(path.dirname(targetCssFile), fs);
        fs.writeFile(targetCssFile,cssContent,function (err) {
           if(err){
               _this.rets.push({
                   fName : targetCssFile.replace(_this.config.destPath,'').replace(/\\/g,'\/'),
                   status : false,
                   message : err.message
               });
           }else{
               _this.rets.push({
                   fName : targetCssFile.replace(_this.config.destPath,'').replace(/\\/g,'\/'),
                   status : true
               });
           }
           //拷贝资源文件到目标地址
            let resources = [];

            //判断文件是否为指定的忽略路径
            _this.resources.forEach(function (r) {
                //ablout:blank , data:image
                if(/\.jpg$|\.gif$|\.png$|\.svg$/.test(r)){
                    resources.push(r);
                }
            });

            if(resources.length > 0 && (_this.config.resourceSyncSwitch == "true" || _this.config.resourceSyncSwitch == true)){
                //文件去重
                let tmp = new Set(resources);
                resources = [];
                for(let r of tmp){
                    resources.push(r);
                }
                //拷贝
                new mover().copyFile(resources,_this.config,function (data) {
                    _this.rets = _this.rets.concat(data);
                    _this.callback(null,_this.rets);
                });
            }else{
                _this.callback(null,_this.rets);
            }
        });
    }
    /**
     * 处理单个media
     * */
    chargeMedia(media,fName){
        var _this = this;
        return function (cb) {
            //开始处理单个的media
            /**
             * 1/获取单个media中的资源请求
             * 2/对资源进行分类
             * 3/合并样式
             * 4/生成雪碧图
             * 5/修改相应的media 下的cssom
             * 6/根据对应media的cssom生成最终的样式文件
             * 7/将最终的样式文件添加到原来的资源列表中
             * */
            /**
             * 结果返回数组
             * */
            let ret = [];
            /**
             * 1/获取单个media中的资源请求
             * */
            //获取css所在的目录
            let rPath = path.dirname(fName) + path.sep;
            let spritePath = rPath.replace(_this.config.localPath,_this.config.destPath) + 'sprite' + path.sep;

            //抽取待合并的图片，并保存到待合并图片的列表中
            let rules = media.rules;
            let len = rules.length;

            //待合并图片的列表及待合并图片和选择器的映射
            let sliceImgs = [];
            let sliceImgs2x = [];

            //根据单倍图解析出的对应的多倍图
            let sliceImgs2xParse = [];
            let sliceMaps = {};

            //svg sprite 图片地址
            let svgSpriteImgs = [];

            let noSvgSpriteImgs = [];

            //待同步的图片列表
            let resourceImgs = [];

            let sliceFeature = _this.config.spriteFolderName || 'slice';
            //console.log(sliceFeature);
            //let tm = /^\s*url\(.+slice\/.+\.png\)$/i;

            let svgRegEx = new RegExp('\^\\s*url\\(\.\*' + sliceFeature + '\\/\.\+\\.svg\.\*\\)$','i');
            let noSvgRegEx = new RegExp('\^\(\?\!\.\*\?'+ sliceFeature+ ')\.\+\\.svg\.\*\\)$','i');
            let pngTester = new RegExp('\^\\s*url\\(\.\*' + sliceFeature + '\\/\.\+\\.png\\)$','i');




            /**
             * @param url : 图片地址的处理
             * @param id :url关键词
             * */
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
             * @param url : 图片地址的处理
             * */
            var chargeUrl = function(url,flag,ruleItem) {
                if(url == null || url == undefined || url == ''){
                    return;
                }

                //判断url是否为远程地址，如果是本地图片才进行进一步处理
                if(url.indexOf('url(http') < 0){
                    //处理不合并svg sprite的svg
                    if(noSvgRegEx.test(url) && flag){
                        let absolutePath = path.resolve(rPath,url.replace(/^url\s*\(\s*/,'').replace(/\s*\)\s*$/,''));
                        noSvgSpriteImgs.push(absolutePath);

                        var svgFill = getParam(absolutePath, 'fill');
                        if(svgFill){
                            var fileName = path.basename(svgFill[1], '.svg') + '-' + svgFill[0] + '.svg';
                            var modifySvgPath = (path.dirname(svgFill[1]) + path.sep) + fileName;

                            //构建映射，单倍图和多倍图使用同一个映射
                            if(sliceMaps[modifySvgPath] == undefined){
                                sliceMaps[modifySvgPath] = [];
                            }

                            sliceMaps[modifySvgPath].push(ruleItem.selectorText);
                        }else{
                            //构建映射，单倍图和多倍图使用同一个映射
                            if(sliceMaps[absolutePath] == undefined){
                                sliceMaps[absolutePath] = [];
                            }

                            sliceMaps[absolutePath].push(ruleItem.selectorText);
                        }
                    }else if(svgRegEx.test(url)  && flag){
                        let absolutePath = path.resolve(rPath,url.replace(/^url\s*\(\s*/,'').replace(/\s*\)\s*$/,''));
                        svgSpriteImgs.push(absolutePath);

                        //构建映射，单倍图和多倍图使用同一个映射
                        if(sliceMaps[absolutePath] == undefined){
                            sliceMaps[absolutePath] = [];
                        }
                        sliceMaps[absolutePath].push(ruleItem.selectorText);
                    }else if(pngTester.test(url) && flag){//待合并的png
                        let absolutePath = path.resolve(rPath,url.replace(/^url\s*\(\s*/,'').replace(/\s*\)\s*$/,''));

                        if(absolutePath.indexOf('@2x.png') >= 0){
                            sliceImgs2x.push(absolutePath);
                        }else{
                            sliceImgs.push(absolutePath);
                            //构造相应的2倍图地址
                            let tmp = absolutePath.replace('.png','@2x.png');
                            try{
                                if(fs.statSync(tmp).isFile()){
                                    //添加相应的图片到数组中，并建立相关的映射
                                    sliceImgs2xParse.push(tmp);
                                    sliceMaps[tmp] = ruleItem.selectorText;
                                }
                            }catch (e){
                                //文件不存在
                            }
                        }

                        //构建映射，单倍图和多倍图使用同一个映射，一个图片可能被多个地方引用，所以这里要将使用到的类选择器添加到一个类名列表
                        if(sliceMaps[absolutePath] == undefined){
                            sliceMaps[absolutePath] = [];
                        }
                        sliceMaps[absolutePath].push(ruleItem.selectorText);

                    }else {
                        //console.log('no url');
                        //console.log(url);
                        _this.resources.push(path.resolve(rPath,url.replace(/^url\s*\(\s*/,'').replace(/\s*\)\s*$/,'')));
                    }
                }else{
                    //远程图片不需要处理
                    //console.log(url);
                }
            }

            /**
             * @param bgStr : 背景图的字符串或数组
             * */
            var chargeBackgroundResource = function(bgStr,flag,ruleItem) {
                if(bgStr){
                    let len = bgStr.length;
                    for(let i = 0 ;i < len ; i++){
                        chargeUrl(bgStr[i],flag,ruleItem);
                    }
                }
            }

            /**
             * @param val : 待提取url值得初始串
             * */
            var filterUrl = function(val) {
                if(val == null || val == undefined || val == ''){
                    return [];
                }else{
                    //如果是数组则把数组也转换成字符串
                    let str = val.toString();
                    return str.match(/url\([^\)]*\)/g);
                }
            }

            for(let i = 0 ; i < len ; i++) {
                let rule = rules[i].style;

                let backgroundImage = rule['background-image'];
                let background = rule['background'];

                //提取背景图引用中的资源地址
                //进行资源地址提取和相应的处理
                if(backgroundImage){
                    let backgroundImageUrls = filterUrl(backgroundImage);
                    chargeBackgroundResource(backgroundImageUrls, true, rules[i]);
                }

                if(background){
                    let backgroundUrls = filterUrl(background);
                    chargeBackgroundResource(backgroundUrls, false, rules[i]);
                }
            }

            //图片地址去重并校验是否存在
            let sliceSet = new Set(sliceImgs),
                slice2xSet = new Set(sliceImgs2x),
                slice2xParseSet = new Set(sliceImgs2xParse),
                svgSpriteImgsSet = new Set(svgSpriteImgs),
                noSvgSpriteImgsSet = new Set(noSvgSpriteImgs);

            //清空待合并列表的数组，将后面去重后的图片地址压入该数组中
            sliceImgs = [],
            sliceImgs2x = [],
            sliceImgs2xParse = [];
            svgSpriteImgs = [];
            noSvgSpriteImgs = [];

            //这种做法是不检查文件的存在性，把文件的检测放到雪碧图合并时做，后面可以考虑是否在这里进行图片存在性的校验
            for(let item of sliceSet){
                sliceImgs.push(item);
            }
            for(let item of slice2xSet){
                sliceImgs2x.push(item);
            }
            for(let item of slice2xParseSet){
                sliceImgs2xParse.push(item);
            }
            for(let item of svgSpriteImgsSet){
                svgSpriteImgs.push(item);
            }
            for(let item of noSvgSpriteImgsSet){
                noSvgSpriteImgs.push(item);
            }

            //svg to png
            let svgPng = function(resolve,reject){
                svgToPng.init(noSvgSpriteImgs,{"destPath":_this.config.destPath,"localPath":_this.config.localPath},function(err,data){
                    if(err){
                        _this.rets.push({
                            fName: fName.replace(_this.config.localPath, '').replace(_this.config.destPath, '').replace(/\\/g, '\/'),
                            status: false,
                            message: err.message
                        });

                        cb(null, {
                            status: false,
                            message: err.message,
                            mediaOM: null
                        });

                        reject();
                        return;
                    }

                    data.forEach(function(file){
                        //将成功处理的路径.svg和转换成.png的图片输出
                        _this.rets.push({
                            fName: file.fName,
                            status: true
                        });

                        let selector = sliceMaps[_this.config.localPath + file.fName.replace(/\//g, path.sep)];

                        if(selector){
                            for (let i = 0; i < len; i++) {
                                if (includes(selector, rules[i].selectorText)) {
                                    let currentLength = rules[i].style.length;
                                    let svgUrl = rules[i].style['background-image'];

                                    if(svgUrl){
                                        if(file.color){
                                            let baseName = path.basename(file.baseName);
                                            let newName = path.basename(file.fName);
                                            let CurrentUrl = svgUrl.replace(baseName,newName);
                                            let pngUrl = CurrentUrl.replace('.svg','.png');

                                            if (rules[i].style['background'] == undefined) {
                                                currentLength++;
                                                rules[i].style[currentLength - 1 + ''] = 'background';
                                            }

                                            rules[i].style.length = currentLength;
                                            rules[i].style['background-image'] = pngUrl;
                                            rules[i].style['background'] = '-webkit-image-set(' + pngUrl + ' 1x,'+ CurrentUrl + ' 2x)';
                                        }else{
                                            let pngUrl = svgUrl.replace('.svg','.png');

                                            if (rules[i].style['background'] == undefined) {
                                                currentLength++;
                                                rules[i].style[currentLength - 1 + ''] = 'background';
                                            }

                                            rules[i].style.length = currentLength;
                                            rules[i].style['background-image'] = pngUrl;
                                            rules[i].style['background'] = '-webkit-image-set(' + pngUrl + ' 1x,'+ svgUrl + ' 2x)';
                                        }
                                    }
                                }
                            }
                        }
                    });

                    resolve();
                });
            }

            //判断是否有svg文件需要合并,优先处理svg场景
            let svgSpritePromise = new Promise(function(resolve, reject) {
                if(svgSpriteImgs.length > 0) {
                    //写图片文件，如果文件目录不存在则创建之
                    common.createPath(spritePath, fs);

                    let svgSpritePath = _this.config.spriteNameSwitch == "true" || _this.config.spriteNameSwitch == true ? spritePath + media.name + '-' + _this.config.spriteName + '.svg' : spritePath + media.name + '.svg';
                    let svgSpritePngPath = _this.config.spriteNameSwitch == "true" || _this.config.spriteNameSwitch == true ? spritePath + media.name + '-' + _this.config.spriteName + '-svg.png' : spritePath + media.name + '-svg.png';

                    svgSpriteInt.init(svgSpriteImgs, svgSpritePath,_this.config,function (err, data) {
                        if (err) {
                            //将错误信息传递给最终的任务处理器
                            _this.rets.push({
                                fName: svgSpritePath.replace(_this.config.destPath, '').replace(/\\/g, '\/'),
                                status: false,
                                message: err.message
                            });
                            cb(null, {
                                status: false,
                                message: err.message,
                                mediaOM: null
                            });

                            reject();
                            return;
                        }

                        //将成功处理的路径.svg和转换成.png的图片输出
                        _this.rets.push({
                            fName: svgSpritePath.replace(_this.config.destPath, '').replace(/\\/g, '\/'),
                            status: true
                        });
                        _this.rets.push({
                            fName: svgSpritePngPath.replace(_this.config.destPath, '').replace(/\\/g, '\/'),
                            status: true
                        });


                        let svgSpriteSize = data.spriteSize;
                        let spriteSizeWidth = data.spriteSizeWidth;
                        let spriteSizeHeight = data.spriteSizeHeight;

                        data.svgSpriteData.forEach(function (svgSpriteData) {
                            let singleWidth = svgSpriteData.width.inner;
                            let singleheight = svgSpriteData.height.inner;
                            let xSizePercent = (spriteSizeWidth / singleWidth ) * 100 + '%';
                            let ySizePercent = (spriteSizeHeight / singleheight) * 100 + '%';

                            //单个小图的位置
                            let absolute = svgSpriteData.position.absolute;
                            let position = svgSpriteData.position.relative;
                            let selector = sliceMaps[svgSpriteData.svgPath];


                            let xPisitionPercent = (absolute.x - 1) / (spriteSizeWidth - singleWidth) * -100 + '%';
                            let yPisitionPercent = (absolute.y - 1) / (spriteSizeHeight - singleheight) * -100 + '%';


                            //console.log(position);
                            //console.log(xPisitionPercent,yPisitionPercent);
                            //console.log(svgSpriteData.position.absolute);


                            //遍历cssom，将选择器为selector的om的属性进行修改
                            for (let i = 0; i < len; i++) {
                                if (includes(selector,rules[i].selectorText)) {
                                    let currentLength = rules[i].style.length;
                                    let svgSpriteFile = path.basename(svgSpritePath);
                                    let svgSpritePngFile = path.basename(svgSpritePngPath);

                                    if (rules[i].style['background-image'] == undefined) {
                                        currentLength++;
                                        rules[i].style[currentLength - 1 + ''] = 'background-image';
                                    }
                                    if (rules[i].style['background-position'] == undefined) {
                                        currentLength++;
                                        rules[i].style[currentLength - 1 + ''] = 'background-position';
                                    }
                                    if (rules[i].style['background-size'] == undefined) {
                                        currentLength++;
                                        rules[i].style[currentLength - 1 + ''] = 'background-size';
                                    }

                                    rules[i].style.length = currentLength;

                                    //在修改下面的属性时，需要修改length属性，对应的属性值等
                                    rules[i].style['background-image'] = 'url(sprite/' + svgSpritePngFile + ');';
                                    rules[i].style['background-image'] += 'background-image:-webkit-image-set(url(sprite/' + svgSpritePngFile + ')1x,url(sprite/' + svgSpriteFile + ') 2x)';
                                    rules[i].style['background-position'] = xPisitionPercent +' '+ yPisitionPercent;
                                    rules[i].style['background-size'] = xSizePercent +' '+ ySizePercent + ';';
                                }
                            }
                        });


                        //处理单个svg to png
                        if(noSvgSpriteImgs.length > 0){
                            svgPng(resolve, reject);
                        }else{
                            resolve();
                        }
                    });
                }else if(noSvgSpriteImgs.length > 0){
                    //处理svg to png
                    svgPng(resolve, reject);
                }else{
                    resolve();
                }
            });


            svgSpritePromise.then(function() {
                //如果有多倍图的合并，则直接进行多倍图的合并处理，忽略单倍图的合并，默认为移动场景
                if (sliceImgs2x.length > 0) {
                    //只合并多倍图
                    Spritesmith.run({
                        src: sliceImgs2x,
                        //雪碧图上图片之间的间距
                        padding: 2
                    }, function (err, images) {
                        var imgs = images;

                        if (err) {
                            cb(null, {
                                status: false,
                                message: err.message
                            });
                        } else {
                            //写图片文件，如果文件目录不存在则创建之
                            common.createPath(spritePath, fs);
                            let spriteFile = _this.config.spriteNameSwitch == "true" || _this.config.spriteNameSwitch == true ? spritePath + media.name + '@2x-' + _this.config.spriteName + '.png' : spritePath + media.name + '@2x' + '.png';
                            fs.writeFile(spriteFile, imgs.image, function (err) {
                                if (err) {
                                    //将错误信息传递给最终的任务处理器
                                    _this.rets.push({
                                        fName: spriteFile.replace(_this.config.destPath, '').replace(/\\/g, '\/'),
                                        status: false,
                                        message: err.message
                                    });
                                    cb(null, {
                                        status: false,
                                        message: err.message,
                                        mediaOM: null
                                    });
                                    return;
                                } else {
                                    _this.rets.push({
                                        fName: spriteFile.replace(_this.config.destPath, '').replace(/\\/g, '\/'),
                                        status: true
                                    });
                                    //雪碧图尺寸和图标在雪碧图上的坐标
                                    let size = imgs.properties;
                                    let coordinates = imgs.coordinates;


                                    //遍历cssom
                                    for (let p in coordinates) {
                                        //单个小图的位置
                                        let position = coordinates[p];
                                        let selector = sliceMaps[p];


                                        //遍历cssom，将选择器为selector的om的属性进行修改
                                        for (let i = 0; i < len; i++) {
                                            //判断是否包含在该选择器列表中
                                            if (includes(selector,rules[i].selectorText)) {
                                                let currentLength = rules[i].style.length;

                                                if (rules[i].style['-webkit-background-size'] == undefined) {
                                                    currentLength++;
                                                    rules[i].style[currentLength - 1 + ''] = '-webkit-background-size';
                                                }
                                                if (rules[i].style['background-size'] == undefined) {
                                                    currentLength++;
                                                    rules[i].style[currentLength - 1 + ''] = 'background-size';
                                                }
                                                if (rules[i].style['background-position'] == undefined) {
                                                    currentLength++;
                                                    rules[i].style[currentLength - 1 + ''] = 'background-position';
                                                }

                                                rules[i].style.length = currentLength;

                                                //在修改下面的属性时，需要修改length属性，对应的属性值等
                                                rules[i].style['background-image'] = 'url(sprite/' + path.basename(spriteFile) + ')';
                                                rules[i].style['-webkit-background-size'] = size.width / 2 + 'px ' + size.height / 2 + 'px';
                                                rules[i].style['background-size'] = size.width / 2 + 'px ' + size.height / 2 + 'px';
                                                rules[i].style['background-position'] = -position.x / 2 + 'px ' + -position.y / 2 + 'px';
                                            }
                                        }
                                    }
                                    //传递结果
                                    cb(null, {
                                        status: true,
                                        mediaTitle: media.description,
                                        mediaOM: rules
                                    });
                                }
                            });
                        }
                    });
                } else if (sliceImgs.length > 0) {
                    /**
                     * 1/判断media下场景是 纯单倍图；纯多倍图；既有单倍图又有多倍图 3种场景
                     * 2/单倍图直接进行合并，然后修改cssom；多倍图直接进行合并，然后生成特定device-ratio下的图片引用代码
                     * 3/产出对应的样式文件代码
                     * */

                    Spritesmith.run({
                        src: sliceImgs,
                        //雪碧图上图片之间的间距
                        padding: 2
                    }, function (err, images) {
                        var imgs = images;
                        if (err) {
                            cb(null, {
                                status: false,
                                message: err.message,
                                mediaOM: null
                            });
                            return;
                        } else {
                            //写图片文件，如果文件目录不存在则创建之
                            common.createPath(spritePath, fs);
                            let spriteFile = _this.config.spriteNameSwitch == "true" || _this.config.spriteNameSwitch == true ? spritePath + media.name + '-' + _this.config.spriteName + '.png' : spritePath + media.name + '.png';

                            fs.writeFile(spriteFile, imgs.image, function (err) {
                                if (err) {
                                    _this.rets.push({
                                        fName: spriteFile.replace(_this.config.destPath, '').replace(/\\/g, '\/'),
                                        status: false,
                                        message: err.message
                                    });
                                    //将错误信息传递给最终的任务处理器
                                    cb(null, {
                                        status: false,
                                        message: err.message,
                                        mediaOM: null
                                    });
                                    return;
                                } else {
                                    _this.rets.push({
                                        fName: spriteFile.replace(_this.config.destPath, '').replace(/\\/g, '\/'),
                                        status: true
                                    });
                                    //雪碧图尺寸和图标在雪碧图上的坐标
                                    let size = imgs.properties;
                                    let coordinates = imgs.coordinates;

                                    //遍历cssom
                                    //console.log(imgs);
                                    for (let p in coordinates) {
                                        //单个小图的位置
                                        let position = coordinates[p];
                                        let selector = sliceMaps[p];


                                        //console.log(selector);

                                        //遍历cssom，将选择器为selector的om的属性进行修改
                                        for (let i = 0; i < len; i++) {
                                            if (includes(selector,rules[i].selectorText)) {
                                                let currentLength = rules[i].style.length;

                                                if (rules[i].style['background-position'] == undefined) {
                                                    currentLength++;
                                                    rules[i].style[currentLength - 1 + ''] = 'background-position';
                                                }

                                                rules[i].style.length = currentLength;

                                                //在修改下面的属性时，需要修改length属性，对应的属性值等
                                                rules[i].style['background-image'] = 'url(sprite/' + path.basename(spriteFile) + ')';
                                                rules[i].style['background-position'] = -position.x + 'px ' + -position.y + 'px';
                                            }
                                        }
                                    }
                                    if (sliceImgs2xParse.length > 0) {
                                        //生成对应多倍图的样式代码
                                        Spritesmith.run({
                                            src: sliceImgs2xParse,
                                            padding: 2
                                        }, function (err, images) {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                //将image的二进制数据写入到对应的雪碧图文件

                                                let target = _this.config.spriteNameSwitch == "true" || _this.config.spriteNameSwitch == true ? spritePath + media.name + '@2x-' + _this.config.spriteName + '.png' : spritePath + media.name + '@2x.png';
                                                fs.writeFile(target, images.image, function (err) {
                                                    if (err) {
                                                        _this.rets.push({
                                                            fName: target.replace(_this.config.destPath, '').replace(/\\/g, '\/'),
                                                            status: false,
                                                            message: err.message
                                                        });
                                                    } else {
                                                        _this.rets.push({
                                                            fName: target.replace(_this.config.destPath, '').replace(/\\/g, '\/'),
                                                            status: true
                                                        });
                                                        let rectangle = images.properties,
                                                            coordinates = images.coordinates;
                                                        let cssTail = '';

                                                        for (let p in coordinates) {
                                                            //获取指定图片的位置/大小
                                                            let item = coordinates[p];
                                                            let selector = sliceMaps[p];

                                                            let cssTailHd = selector + '{';
                                                            let cssTailBd = '';
                                                            let cssTailFt = '}';

                                                            //获取指定图片对应的cssom
                                                            for (let i = 0; i < len; i++) {
                                                                if (rules[i].selectorText == selector) {
                                                                    let styles = rules[i].style;
                                                                    for (let j = 0; j < styles.length; j++) {
                                                                        let p = styles[j];
                                                                        let v = '';
                                                                        if (p == 'background-image') {
                                                                            v = 'url(sprite/' + path.basename(target) + ')';
                                                                        } else if (p == 'background-size' || p == '-webkit-background-size') {
                                                                            v = rectangle.width / 2 + 'px ' + rectangle.height / 2 + 'px';
                                                                        } else if (p == 'background-position') {
                                                                            v = -item.x / 2 + 'px ' + -item.y / 2 + 'px';
                                                                        } else {
                                                                            v = styles[p];
                                                                        }
                                                                        cssTailBd += p + ':' + v + ';'
                                                                    }
                                                                    if (cssTailBd.indexOf('background-position') < 0) {
                                                                        cssTailBd += 'background-position:' + -item.x / 2 + 'px ' + -item.y / 2 + 'px;';
                                                                    }
                                                                    if (cssTailBd.indexOf('background-size') < 0) {
                                                                        cssTailBd += '-webkit-background-size:' + rectangle.width / 2 + 'px ' + rectangle.height / 2 + 'px;';
                                                                        cssTailBd += 'background-size:' + rectangle.width / 2 + 'px ' + rectangle.height / 2 + 'px;';
                                                                    }
                                                                }
                                                            }
                                                            cssTail += cssTailBd == '' ? '' : cssTailHd + cssTailBd + cssTailFt;
                                                        }

                                                        //传递结果
                                                        cb(null, {
                                                            status: true,
                                                            mediaTitle: media.description,
                                                            mediaOM: rules,
                                                            cssTail: cssTail
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    } else {
                                        //传递结果
                                        cb(null, {
                                            status: true,
                                            mediaTitle: media.description,
                                            mediaOM: rules
                                        });
                                    }
                                }
                            });
                        }
                    });
                } else {
                    //无图片需要合并
                    cb(null, {
                        status: true,
                        mediaTitle: media.description,
                        mediaOM: rules
                    });
                }
            });
        }
    }
}

module.exports = Media;