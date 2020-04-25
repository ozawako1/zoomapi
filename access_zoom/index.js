var rp = require('request-promise');
var jwt = require('jsonwebtoken');

const FUNC_USERS = 1;
const FUNC_MEETINGS = 2;

function is_empty(x){
    var ret = false;
    if (x == undefined || x == "") {
        ret = true;
    }
    return ret;
}

/*
// QUERY_STRING
// func: 1=GetUsers, 2=GetMeetings
// zuid: Zoom User Id to GetMeetings
// now : Zoom Meeting Type ("live", "upcoming")
 */

module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    // query parameter is needed.
    var FUNC_TYPE = parseInt(req.query.func);
    var z_uri = "";
    var m_zuid = req.query.zuid;
    var m_type = req.query.type;
    var z_qs = "";

    try {
    
        switch (FUNC_TYPE) {
        case FUNC_USERS:
            z_uri = 'https://api.zoom.us/v2/users'
            z_qs = {
                status: 'active',
                page_size: 100
            };
            break;
        case FUNC_MEETINGS:
            if (is_empty(m_zuid)){
                throw { 'status': 400, 'body': "zuid or mtype missing."};
            }
            z_uri = 'https://api.zoom.us/v2/users/' + m_zuid +'/meetings',
            z_qs = {
                type: m_type
            };
            break;
        default:
            throw { 'status': 400, 'body': "unknown func type."};
            break;
        }
        
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
            uri: z_uri,
            qs: z_qs,
            auth: {
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
                context.log('User has response');

                var rep = "";
                switch (FUNC_TYPE) {
                case FUNC_USERS:
                    rep = response.users;
                    break;
                case FUNC_MEETINGS:
                    rep = response.meetings;
                    break;
                default:
                    break;
                }

                context.res = {
                    "status": 200,
                    "content-type": "application/json",
                    "body": JSON.stringify(rep)
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
            
    } catch (e) {

        context.log('API call failed, reason ', e.body);
        context.res = {
            "status": e.status,
            "content-type": "application/json",
            "body": { "Error": e.body }
        };
        context.done();

    }

};
