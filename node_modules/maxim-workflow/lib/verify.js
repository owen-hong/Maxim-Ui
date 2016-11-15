var stylelint = require('stylelint');

var stylelintConfig = {
    //"extends": [
    //    "stylelint-config-standard",
    //],
    "rules": {
        //"bolck-no-empty": true,
        "color-no-invalid-hex": true,
        "property-no-unknown": true,
    }
}


module.exports = {
    verifyFile: function (file,callback) {
        stylelint.lint({
            code: file,
            config: stylelintConfig,
            formatter: "string",
            //files:file
        })
        .then(function(data) {
            console.log('postscss........');
            //console.log(data.results);
            //console.log(data.results[0].warnings);

            if(data.results[0].errored === true){
                var errorMes = '';
                data.results[0].warnings.forEach(function(errMessage){
                    errorMes += errMessage.text +'\\br\\'
                });

                callback({
                    status: false,
                    message:errorMes
                });
            }else{
                callback({
                    status: true
                });
            }
        })
        .catch(function(err) {
            callback({
                status: false,
                message:err.message
            });
        });
    }
};