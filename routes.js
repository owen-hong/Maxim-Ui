/**
 * Created by owenhong on 2015/11/10.
 */

var Home = require('./controllers/index');


exports.handle = function (app) {
    //index
    app.get('/', Home.index);

    //config.js
    app.get('/config.js', Home.configData);

    //delete poroject
    app.get('/deleteProject', Home.deleteProject);

    //update right panel
    app.post('/updateCssSprite', Home.updateCssSprite);

    //upload file
    app.post('/tools/doUploader', Home.doUploader);


    //validate ftp fields
    app.get('/validateFtp', Home.validateFtp);

    //edit config.js
    app.post('/tools/doConfig', Home.doConfig);

    //export config
    app.get('/global/exportConfig', Home.exportConfig);
    app.get('/global/importConfig', Home.importConfig);

}







