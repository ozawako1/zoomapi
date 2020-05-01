//sqldb.js
var DBConnection = require('tedious').Connection;
var DBRequest = require('tedious').Request;  
var TYPES = require('tedious').TYPES;
var Promise = require('promise');

const URL_AZURE_SQLDB = "mydomesticdatabase.database.windows.net";

/*
var my_config = {
    "userName": process.env.MY_AZURE_SQLDB_USERNAME,
    "password": process.env.MY_AZURE_SQLDB_PASSWORD,
    "server": URL_AZURE_SQLDB,
    "options":{
        "useColumnNames": true,
        "rowCollectionOnRequestCompletion": true,
        "encrypt": true,
        "database": process.env.MY_AZURE_SQLDB_DATABASE
    }
};
*/
var my_config = {
    server: URL_AZURE_SQLDB,
    authentication: {
        type: 'default',
        options: {
            userName: process.env.MY_AZURE_SQLDB_USERNAME,
            password: process.env.MY_AZURE_SQLDB_PASSWORD,
        }
    },
    options: {
        useColumnNames: true,
        rowCollectionOnRequestCompletion: true,
        encrypt: true,
        database: process.env.MY_AZURE_SQLDB_DATABASE
    }
};


function db_conn(){

    console.log("Connecting...");

    return new Promise((resolve, reject) => {
        //CreateConnection
        var conn = new DBConnection(my_config);
        conn.on('connect', function(err) {  
            if(err){
                reject(err);
            } else {  
                // If no error, then good to proceed.
                console.log("Connected");
                resolve(conn);
            }
        });
    });
}

function db_execquery(conn, query, params){ 

    var results = [];

    return new Promise((resolve, reject) => {

        queryrequest = new DBRequest(query, function(err, rowCount, rows){
            if (err) {
                reject(err);
            } else if (rowCount == 0){
                reject(new Error("not Found."))
            } else {
                console.log(rowCount + " row(s) found.");
                rows.forEach(function(row){
                    results.push(row);
                });
            }
        });  

        params.forEach((p) => {
            queryrequest.addParameter(p.name, p.type, p.value);
        });

        queryrequest.on('requestCompleted', function(){
            console.log('reqCompleted');
            conn.close();
            resolve(results);
        });

        conn.execSql(queryrequest);
    });
}


exports.query_id_from_email = function(email) {
    console.log("query zoomusers");

    var query = "select z.id FROM dbo.USERS_ZOOM as z WHERE z.email = @who_email";
    var params = [
        {
            name: 'who_email',
            type: TYPES.NVarChar, 
            value: email
        }
    ];

    return new Promise((resolve, reject) => {
        db_conn()
        .then(conn => db_execquery(conn, query, params))
        .then((results) => {
            if (results.length == 1) {
                resolve(results[0].id.value.trim());
            } else{
                reject(new Error("Too many ids."));
            }
        })
        .catch((err) => reject(err));
    });
}

