'use strict';
var express = require('express');
var router = express.Router();

var sql = require("mssql");
var dbConfig = require('../Database/dbConnection');

/* Get All Students */
router.get('/getPersonData', function (req, res) {
    sql.connect(dbConfig.dbConnection()).then(() => {
        console.log(" conection established ", sql.Table);
        
        return sql.query("SELECT * FROM Person");
    }).then(result => {
        console.log(" query result  ", result);
        res.json({ data: result.recordset })
    }).catch(err => {
        console.log('Error in query ', err)
    })
});


module.exports = router;
