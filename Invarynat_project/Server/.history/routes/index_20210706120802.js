'use strict';
var express = require('express');
var router = express.Router();

var sql = require("mssql");
var dbConfig = require('../Database/dbConnection');

/* Get All Students */
router.get('/', function (req, res) {
    console.log(" inside default router ");

    sql.connect(dbConfig.dbConnection()).then(() => {
        console.log(" conection established ");

        return sql.query("SELECT * FROM dbo.Person;");
    }).then(result => {
        console.log(" query result  ", result);
        
        res.render('index', { studentList: result.recordset }) //res.render() pass a local variable to the view
    }).catch(err => {
        console.log(err)
    })
});


module.exports = router;
