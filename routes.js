/**
 * Created by owenhong on 2015/11/10.
 */

var Home = require('./controllers/index');


exports.handle = function (app) {

    app.get('/', Home.index);
    app.get('/addProject', Home.addProject);
    app.get('/editProject', Home.editProject);
    app.get('/updateProject', Home.updateProject);


    app.get('/deleteProject', Home.deleteProject);

    app.get('/globalSetting', Home.globalSetting);

    app.post('/updateCssSprite', Home.updateCssSprite);

    app.post('/tools/doUploader', Home.doUploader);


    app.get('/validateFtp', Home.validateFtp);
    app.post('/tools/doConfig', Home.doConfig);
}







