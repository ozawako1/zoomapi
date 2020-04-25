
var rp = require('request-promise');

module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    
    //Make Zoom API call
    var options = {
        uri: process.env.ZOOM_ACCESS_URL,
        qs: {
            func: 1
        }
    };

    rp(options)
        .then(function (response) {
            //logic for your response
            context.log('User has', response);
            context.res = {
                "status": 200,
                "content-type": "application/json",
                "body": response
            };
            context.done();
        })
        .catch(function (err) {
            context.log('API call failed, reason ', err);
            context.res = {
                "status": err.statusCode,
                "content-type": "application/json",
                "body": {Error: err.message}
            };
            context.done();
        });

};
