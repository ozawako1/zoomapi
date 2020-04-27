var rp = require('request-promise');
var jwt = require('jsonwebtoken');


/*
// QUERY_STRING
// zuid: Zoom User Id to GetMeetings
// returns meeting object.
// {
// id: string       // meeting id
// host_id: string  // host user id
// topic: string    // meeting title
// type: integer    // 1=instant, 2=scheduled, 3=recurring(w/o time), 4=recurring(w/time)
// start_time: string
// duration: integer    // minitus
// timezone: string
// created_at: string
// join_url: string     // url to join live meeting
// start_url: string    // url to start upcoming meeting
// live: string     // if "true", meeting is active, else meeting is upcoming.
// }
*/

function get_live_meeting(zuid){

    // in app settings.
    const ZOOM_ACCESS_URL = process.env.ZOOM_ACCESS_URL;
        
    var zoom_user_id = zuid;

    return new Promise((resolve, reject) => {
        if (zoom_user_id == "" || zoom_user_id == undefined) {
            reject(new Error("Invalid parameters. (zoom uid)"));
        } else {        
            var options = {
                uri: ZOOM_ACCESS_URL,
                qs: {
                    func: 2, 
                    zuid: zoom_user_id,
                    type: 'live'
                },
                json: true
            };
            rp(options)
                .then(function (response) {
                    if (response.length !=0) {
                        response[0].live = "true";
                    }
                    resolve(response);  //Live MTG をかえす。
                })
                .catch(function (err) {
                    reject(err);
                });
        }
    
    });

}

function is_same_mtg(mtg1, mtg2){
    var ret = false;

    if (mtg2 != null && mtg2.uuid != undefined) {
        if (mtg1.uuid == mtg2.uuid){
            ret = true;
        }
    }

    return ret;
}

function get_next_meeting(zuid, livemtg){
    // in app settings.
    const ZOOM_ACCESS_URL = process.env.ZOOM_ACCESS_URL;
        
    var zoom_user_id = zuid;

    var mtgs = new Array();
    var live = null;
    if (livemtg != null && livemtg.length > 0){
        live = livemtg[0];
        mtgs.push(live);
    }

    return new Promise((resolve, reject) => {
        if (zoom_user_id == "" || zoom_user_id == undefined) {
            reject(new Error("Invalid parameters. (zoom uid)"));
        } else {        
            var options = {
                uri: ZOOM_ACCESS_URL,
                qs: {
                    func: 2, 
                    zuid: zoom_user_id,
                    type: 'upcoming'
                },
                json: true
            };

            rp(options)
                .then(function (response) {
                    if (response.length != 0) {
                        var i = 0;
                        var mtg = null;
                        while (i < response.length) {
                            mtg = response[i];
                            if (mtg.start_time != undefined) {
                                if (is_same_mtg(mtg, live)) {
                                    continue;
                                } else {
                                    mtgs.push(mtg);
                                    //最大３つまで
                                    if (mtgs.length >= 3) {
                                        break;
                                    }
                                }               
                            }
                            i++;
                        }
                    }
                    resolve(mtgs);   // 進行中のものも含めてMTGsをかえす
                })
                .catch(function (err) {
                    reject(err);
                });
        }
    
    });
}

function get_meetings(zuid){

    return new Promise((resolve, reject) =>{
        get_live_meeting(zuid)
        .then((live) => {   
            get_next_meeting(zuid, live)
            .then((mtgs) =>{
                resolve(mtgs);
            })
            .catch((err) => reject(err));
        })
        .catch((err) => reject(err));
    });

}

module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    // in app settings.
    const ZOOM_ACCESS_URL = process.env.ZOOM_ACCESS_URL;
        
    // query parameter is needed.
    var zoom_user_id = req.query.zuid;

    if (zoom_user_id == "" || zoom_user_id == undefined) {
        context.res = {
            "status": 400,
            "content-type": "application/json",
            "body": { "Error": "Invalid Parameters." }
        };
        context.done();
    } else {
        get_meetings(zoom_user_id)
            .then((result) => {
                context.res = {
                    "status": 200,
                    "content-type": "application/json",
                    "body": result
                };
                context.done();
            })
            .catch((err) =>{
                context.res = {
                    "status": 500,
                    "content-type": "application/json",
                    "body": err
                };
                context.done();               
            });
    }

};
