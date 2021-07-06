'use strict';
var express = require('express');
var router = express.Router();

var sql = require("mssql");
var dbConfig = require('../Database/dbConnection');

/* Get All Person */
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

/* Get All Visit */
router.get('/getVisitData', function (req, res) {
    sql.connect(dbConfig.dbConnection()).then(() => {
        return sql.query("select [PERSON_ID], [CURRENT_AGE], Category = 'Risk Factors - Non Red Flag' from [dbo].[Person] where [CURRENT_AGE]>=40");
    }).then(result => {
        console.log(" query result  ", result);
        res.json({ data: result.recordset })
    }).catch(err => {
        console.log('Error in query ', err)
    })
});



module.exports = router;
