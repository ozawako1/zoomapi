
var rp = require('request-promise');
var fs = require('fs');
var jwt = require('jsonwebtoken');

module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    // in app settings.
    const ZOOM_API_KEY = process.env.ZOOM_API_KEY;
    const ZOOM_API_SEC = process.env.ZOOM_API_SEC;
    
    var payload = {
        iss: ZOOM_API_KEY,
        exp: ((new Date()).getTime() + 5000)
    }
    var token = jwt.sign(payload, ZOOM_API_SEC);
    
    //Make Zoom API call
    var options = {
        uri: 'https://api.zoom.us/v2/users',
        qs: {
            status: 'active',
            page_size: 100
        },
        auth: {
        //Provide your token here
                'bearer': token
        },
        headers: {
            'User-Agent': 'Zoom-Jwt-Request',
            'content-type': 'application/json'
        },
        json: true // Automatically parses the JSON string in the response
    };

    rp(options)
        .then(function (response) {
            //logic for your response
            context.log('User has', response);
            var users = JSON.stringify(response);
            context.res = {
                "status": 200,
                "content-type": "application/json",
                "body": users
            };
            context.done();
        })
        .catch(function (err) {
            context.log('API call failed, reason ', err);
            context.res = {
                "status": 500,
                "content-type": "application/json",
                "body": { "Error": err.message + "|" + err.stack }
            };
            context.done();
        });

};
