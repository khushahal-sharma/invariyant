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
/*router.get("/getPersonData", function (req, res) {
  sql
    .connect(dbConfig.dbConnection())
    .then((pool) => {
      return sql.query(
          "SELECT Top 100 * FROM Person Where [RACE] like '%African American%'"
        )
      
    })
    .then((result) => {
      console.log(" result ", result);
      //console.log(" result ", result.recordsets);

      const preparedResult = [];

      result.recordset.forEach((item) => {
        preparedResult.push({
          PERSON_ID: item.PERSON_ID,
          isAfricanAmerican: item.RACE === "African American" ? "Yes" : "No",
          isAgeMoreThan40: item.CURRENT_AGE >= 40 ? "Yes" : "NO",
        });
      });

      res.json({ data: preparedResult });
    })
    .catch((err) => {
      console.log("Error in query ", err);
    });
});*/

router.get("/getPersonData", async function (req, res) {
  try {
    await sql.connect(dbConfig.dbConnection());
    /* let result = await sql.query(
      "SELECT Top 100 * FROM Person Where [RACE] like '%African American%'"
    );*/

    let result = await sql.query("SELECT Top 100 * FROM Person"),
      uniquePersonIllnes = {},
      personIdValues = "";

    // find unique persion id.
    (result.recordset || []).forEach(
      ({ PERSON_ID, RACE, CURRENT_AGE } = {}) => {
        uniquePersonIllnes[PERSON_ID] = {
          RACE,
          CURRENT_AGE,
          PERSON_ID,
          VISITS: {},
        };

        // Creating person values;
        personIdValues += personIdValues.length
          ? `,${PERSON_ID}`
          : `${PERSON_ID}`;
      }
    );

    //console.log(" personIdValues ", personIdValues);

    let EventResult = await sql.query(
      `SELECT * FROM Events Where PERSON_ID IN (${personIdValues})`
    );

    //console.log(" EventResult ", EventResult);

    (EventResult.recordset || []).forEach((item) => {
      const { EVNET_ID, PERSON_ID, VISIT_ID, EVENT_CD, RESULT_VAL } = item;
      if (uniquePersonIllnes[PERSON_ID]) {
        // Add Visit_ID wise data to each person.
        !uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID] &&
          (uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID] = {});

        //Add Systolic BP details to Person widget.
        if (EVENT_CD == 102225120) {
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID][
            "Resting_Systolic_BP"
          ] = RESULT_VAL >= 140 ? "Yes" : "No";
        }
      }
    });

    /* Final Object
    {"Person_ID":{
      Race: "",
      Current_AGE;
      VISTES : {
        "232":{
          systolic_BP: 'yes',
          vist_data: ""
        },
        "233":{
        
        }
      }
    }}
    
     */

    //console.log(" uniquePersonIllnes ", uniquePersonIllnes);

    //Prepare final result array from uniquePersonIllnes Object.
    const preparedResult = [];
    for (let PersonID in uniquePersonIllnes) {
      const personDetails = uniquePersonIllnes[PersonID];

      for (let visitId in personDetails["VISITS"]) {
        const visitDetail = personDetails["VISITS"][visitId];

        preparedResult.push({
          PERSON_ID: personDetails.PERSON_ID,
          VISIT_ID: visitId,
          isAfricanAmerican:
            personDetails.RACE === "African American" ? "Yes" : "No",
          isAgeMoreThan40: personDetails.CURRENT_AGE >= 40 ? "Yes" : "No",
          Resting_Systolic_BP: visitDetail.Resting_Systolic_BP || "NA",
        });
      }
    }

    //console.log(" preparedResult ", preparedResult);

    res.json({ data: preparedResult });
  } catch (err) {
    console.log("Error in query ", err);
  }
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
