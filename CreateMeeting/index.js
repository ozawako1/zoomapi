var rp = require('request-promise');


/*
// METHOD: POST
// zuid: zuid
// topic: Meeting Title
// stime: Meeting StartTime "YYYY-MM-DDTHH:mm:SSZ+09:00"
// duration: meeting duration
*/
module.exports = function (context, req) {
    context.log('CreateMeeting HTTP trigger function processed a request.');

    //Make Zoom API call
    var options = {
        method: 'POST',
        uri: process.env.ZOOM_ACCESS_URL,
        body: {
            func: 3,
            zuid: req.body.zuid,
            topic: req.body.topic,
            type: 2,
            start_time: req.body.stime,
            duration: req.body.duration,
            timezone: 'Asia/Tokyo',
            password: 'motex'
        },
        headers: {
            'content-type': 'application/json'
        },
        json: true
    };

    rp(options)
        .then(function (response) {
            //logic for your response
            context.log('User has', response);
            var res = {
                topic: response.topic,
                start_url: response.start_url,
                join_url: response.join_url,
                password: response.password
            };
            context.res = {
                "status": 200,
                "content-type": "application/json",
                "body": res
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