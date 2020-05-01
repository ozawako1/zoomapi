var rp = require('request-promise');
var jwt = require('jsonwebtoken');

const FUNC_USERS = 1;
const FUNC_MEETINGS = 2;
const FUNC_CREATEMEETING = 3;

function is_empty(x){
    var ret = false;
    if (x == undefined || x == "") {
        ret = true;
    }
    return ret;
}

/*
// QUERY_STRING
// func: 1=GetUsers, 2=GetMeetings, 3=CreateMeeting
// zuid: Zoom User Id to GetMeetings
// now : Zoom Meeting Type ("live", "upcoming")
 */

module.exports = function (context, req) {
    context.log('access_zoom HTTP trigger function processed a request.');

    var requests;
    
    if (req.method == "GET") {
        requests = req.query;
    } else {
        requests = req.body;
    }

    // query parameter is needed.
    var FUNC_TYPE = parseInt(requests.func)
    var m_zuid = requests.zuid;

    var z_uri = "";
    var z_qs = "";
    var z_body = null;
    var z_method = "GET";

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
            var m_type = requests.type;
            z_uri = 'https://api.zoom.us/v2/users/' + m_zuid +'/meetings',
            z_qs = {
                type: m_type
            };
            break;
        case FUNC_CREATEMEETING:
            /*
            body: {
                func: 3
                zuid: req.body.zname,
                topic: req.body.topic,
                type: 2,
                start_time: req.body.stime,
                duration: req.body.duration,
                timezone: 'Asia/Tokyo',
                password: 'motex'
            }
            */
            if (is_empty(m_zuid)){
                throw { 'status': 400, 'body': "zuid or mtype missing."};
            }
            z_method = "POST";
            z_uri = 'https://api.zoom.us/v2/users/' + m_zuid +'/meetings',
            z_body = {
                topic: requests.topic,
                type: parseInt(requests.type),
                start_time: requests.start_time,
                duration: requests.duration,
                timezone: requests.timezone,
                password: requests.password
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
            method: z_method,
            uri: z_uri,
            qs: z_qs,
            auth: {
                'bearer': token
            },
            headers: {
                'User-Agent': 'Zoom-Jwt-Request',
                'content-type': 'application/json'
            },
            body: z_body,
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
                case FUNC_CREATEMEETING:
                    /*
                    topic: response.topic,
                    start_url: response.start_url,
                    join_url: response.join_url,
                    password: response.password
                    */
                    rep = {
                        topic: response.topic,
                        start_url: response.start_url,
                        join_url: response.join_url,
                        password: response.password
                    };
                    break;
                default:
                    break;
                }

                context.res = {
                    "status": 200,
                    "content-type": "application/json",
                    "body": rep
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
            //"content-type": "application/json",
            "body": { "Error": e.body }
        };
        context.done();

    }

};
