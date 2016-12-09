/**
 * Created by owenhong on 2016/12/8.
 */

'use strict';

const crypto = require('crypto');

/**
 * 加密函数
 * @param text  需要加密的内容
 * @param key   秘钥
 * @returns {Query|*}  密文
 */

var md5 = {};
md5.encode = function(text,key){
    let secret = key || "Maxim-md5..*";
    let cipher = crypto.createCipher('aes-256-cbc',secret);
    let crypted =cipher.update(text,'utf8','hex');
    crypted+=cipher.final('hex');
    //console.log(crypted);
    return crypted;
}

/**
 * 解密函数
 * @param text  需要解密的内容
 * @param key   秘钥
 * @returns {Query|*}
 */
md5.decode = function(text,key){
    let secret = key || "Maxim-md5..*";
    let decipher = crypto.createDecipher('aes-256-cbc',secret);
    let dec = decipher.update(text,'hex','utf8');
    //console.log(decipher);
    dec += decipher.final('utf8');//解密之后的值

    return dec;
}
module.exports = md5;