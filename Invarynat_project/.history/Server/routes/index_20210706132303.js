"use strict";
var express = require("express");
var router = express.Router();

var sql = require("mssql");
var dbConfig = require("../Database/dbConnection");

/* test api by getting 1 data of person table */
router.get("/testApi", function (req, res) {
  sql
    .connect(dbConfig.dbConnection())
    .then(() => {
      console.log(" conection established ", sql.Table);
      return sql.query("SELECT TOP 3 * FROM Person");
    })
    .then((result) => {
      console.log(" query result  ", result);
      res.json({ data: result.recordset });
    })
    .catch((err) => {
      console.log("Error in query ", err);
    });
});

/* Get All Person */
router.get("/getPersonData", function (req, res) {
  sql
    .connect(dbConfig.dbConnection())
    .then(() => {
      return sql.query("SELECT * FROM Person");
    })
    .then((result) => {
      res.json({ data: result.recordset });
    })
    .catch((err) => {
      console.log("Error in query ", err);
    });
});

/* Get All Visit */
router.get("/getVisitData", function (req, res) {
  sql
    .connect(dbConfig.dbConnection())
    .then(() => {
      return sql.query(
        "select [PERSON_ID], [CURRENT_AGE], Category = 'Risk Factors - Non Red Flag' from [dbo].[Person] where [CURRENT_AGE]>=40"
      );
    })
    .then((result) => {
      res.json({ data: result.recordset });
    })
    .catch((err) => {
      console.log("Error in query ", err);
    });
});

/* Get Risky race*/
router.get("/getRace", function (req, res) {
  sql
    .connect(dbConfig.dbConnection())
    .then(() => {
      return sql.query(
        "select [PERSON_ID], [RACE], Category = 'Risk Factors - Non Red Flag' from [dbo].[VISITS] where [RACE] like '%African American%'"
      );
    })
    .then((result) => {
      res.json({ data: result.recordset });
    })
    .catch((err) => {
      console.log("Error in query ", err);
    });
});

/* Get Systolic BP */
router.get("/getSystolicBP", function (req, res) {
  sql
    .connect(dbConfig.dbConnection())
    .then(() => {
      return sql.query(
        `select [PERSON_ID], [SUBCATEGORY], [EVENT_CD], [RESULT_VAL],  Category = 'Risk Factors - Non Red Flag' from dbo.Events where category = 'Event' and [SUBCATEGORY] = 'Vitals' and [EVENT_CD] = '102225120' and RESULT_VAL >= 160`
      );
    })
    .then((result) => {
      res.json({ data: result.recordset });
    })
    .catch((err) => {
      console.log("Error in query ", err);
    });
});

module.exports = router;
