var rp = require('request-promise');
var jwt = require('jsonwebtoken');


/*
// QUERY_STRING
// zuid: Zoom User Id to GetMeetings
// now : if "true", live Meeting
*/
module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    // in app settings.
    const ZOOM_ACCESS_URL = process.env.ZOOM_ACCESS_URL;
        
    // query parameter is needed.
    var zoom_user_id = req.query.zuid;
    var meeting_type = req.query.now;
    if (meeting_type == "true") {
        meeting_type = "live";
    } else {
        meeting_type = "upcoming";
    }

    if (zoom_user_id == "" || zoom_user_id == undefined) {
        context.res = {
            "status": 400,
            "content-type": "application/json",
            "body": { "Error": "Invalid Parameters." }
        };
        context.done();
    } else {
        
        var options = {
            uri: ZOOM_ACCESS_URL,
            qs: {
                func: 2, 
                zuid: zoom_user_id,
                type: meeting_type
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
    }

};
