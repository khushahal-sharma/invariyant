'use strict';
var express = require('express');
var router = express.Router();

var sql = require("mssql");
var dbConfig = require('../Database/dbConnection');

/* Get All Students */
router.get('/', function (req, res) {
    sql.connect(dbConfig.dbConnection()).then(() => {
        return sql.query("SELECT * FROM StudentInfo;");
    }).then(result => {
        res.render('index', { studentList: result.recordset }) //res.render() pass a local variable to the view
    }).catch(err => {
        console.log(err)
    })
});

/* Add Student */
router.post('/addStudent', function (req, res) {
    sql.connect(dbConfig.dbConnection()).then(() => {
        return sql.query("INSERT INTO StudentInfo VALUES('" + req.body.txtName + "', " + req.body.txtAge + ")");
    }).then(result => {
        res.redirect('back')
    }).catch(err => {
        console.log(err)
    })
});

/* Delete Student */
router.get('/deleteStudent/:ID', function (req, res) {
    sql.connect(dbConfig.dbConnection()).then(() => {
        return sql.query("DELETE FROM StudentInfo WHERE ID = " + req.params.ID);
    }).then(result => {
        res.redirect('back')
    }).catch(err => {
        console.log(err)
    })
});

/* Edit Student */
router.get('/editStudent/:ID', function (req, res) {
    sql.connect(dbConfig.dbConnection()).then(() => {
        return sql.query("SELECT * FROM StudentInfo WHERE ID = " + req.params.ID);
    }).then(result => {
        res.send(result.recordset[0])
    }).catch(err => {
        console.log(err)
    })
});

/* Update Student */
router.post('/updateStudent', function (req, res) {
    sql.connect(dbConfig.dbConnection()).then(() => {
        return sql.query("UPDATE StudentInfo SET [Name] = '" + req.body.txtEName + "', Age = " + req.body.txtEAge + " WHERE ID = " + req.body.txtID);
    }).then(result => {
        res.redirect('back')
    }).catch(err => {
        console.log(err)
    })
});

module.exports = router;
