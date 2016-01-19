module.exports = {
    /*
     p : 希望创建的目录的绝对地址
     fs : node的fs模块，可通过require('fs')得到
     * */
    createPath : function(p,fs){
        var plat = this.getCurrentPlat();
        var split = plat.split;
        //因为我们这里的目录都是绝对路径，因此使用\来分割
        var dirs = p.split(split);
        //盘符下的第一级目录
        var newDir = '';
        //去掉以\结尾的字符串带来的最后一个数字
        var count = dirs.length;
        if(p[p.length-1] == split){
            count = dirs.length - 1;
        }
        for(var i = 0; i < count; i++){
            newDir += dirs[i] + split;
            //判断目录是否存在，不存在就创建目录
            if(!fs.existsSync(newDir)){
                console.log(newDir + ' is not existed');
                try{
                    fs.mkdirSync(newDir);
                    console.log(newDir + 'is created');
                }catch(e){
                    console.log(newDir + 'is not created because of : '+ e.message);
                }
            }else{
                //该目录是存在的，不处理
            }
        }
    },
    //判断是什么操作系统，返回值为windows、mac、linux中的一种
    getPlatName : function(){
        var plat = process.platform;
        if(/^win*/.test(plat) == true){
            return 'windows';
        }else if(plat.indexOf('darwin') >= 0){
            return 'mac';
        }else if(plat.indexOf('linux') >= 0){
            return 'linux';
        }else if(plat.indexOf('freebsd') >= 0){
            return 'freebsd';
        }else if(plat.indexOf('sunos') >= 0){
            return 'sunos';
        }
        return 'unknown';
    },
    //获取指定系统相关的配置
    getPlat : function (os) {
        var plat = require('./plat.js');
        return plat[os];
    },
    //获取当前操作系统的配置内容
    getCurrentPlat : function(){
        var plat = require('./plat.js');
        return plat[this.getPlatName()];
    }
};