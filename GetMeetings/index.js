/*
module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    const name = (req.query.name || (req.body && req.body.name));
    const responseMessage = name
        ? "Hello, " + name + ". This HTTP triggered function executed successfully."
        : "This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response.";

    context.res = {
        // status: 200
        body: responseMessage
    };
}
*/

var rp = require('request-promise');
var jwt = require('jsonwebtoken');

module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    // query parameter is needed.
    var zoom_user_id = req.query.uid;
    if (zoom_user_id == "" || zoom_user_id == undefined) {
        context.res = {
            "status": 400,
            "content-type": "application/json",
            "body": { "Error": "Invalid Parameters." }
        };
        context.done();
    } else {
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
            uri: 'https://api.zoom.us/v2/users/' + zoom_user_id +'/meetings',
            qs: {
                type: 'upcoming', // -> uri + '?status=active'
                page_size: 3
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
                var users = JSON.stringify(response.meetings);
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
    }

};
