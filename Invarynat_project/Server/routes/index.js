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

router.get("/getPersonData", async function (req, res) {
  try {
    await sql.connect(dbConfig.dbConnection());
    /* let result = await sql.query(
      "SELECT Top 100 * FROM Person Where [RACE] like '%African American%'"
    );*/

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

    let EventResult = await sql.query(
      `SELECT * FROM Events Where PERSON_ID IN (${personIdValues})`
    );

    let visitResult = await sql.query(
      `SELECT * FROM Visits Where PERSON_ID IN (${personIdValues})`
    );
    let DiagnosesResult = await sql.query(
      `SELECT * FROM Diagnoses Where PERSON_ID IN (${personIdValues})`
    );
    // console.log("diagnoses",DiagnosesResult);

    //preapare Visit map with details.
    let visitIDMap = {};
    (visitResult.recordset || []).forEach((item) => {
      visitIDMap[item.VISIT_ID] = {
        ...item,
      };
    });
    
    (DiagnosesResult.recordset || []).forEach((item)=>{
      const { VALUE, PERSON_ID, VISIT_ID, EVENT_DESC } = item;
      if(uniquePersonIllnes[PERSON_ID]){
        !uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID] &&
            (uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID] = {});
        if( VALUE === "O99.419"){
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["History_of_cardiovascular_disease"] = "Yes"
        }
        if( VALUE === "R09.02"){
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Swelling_in_face_or_hands"] = "Yes"
        }
        if( VALUE === "R06.02"){
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Shortness_of_breath_at_rest"] = "Yes"
        }
        if( VALUE === "R06.01" && EVENT_DESC === "Severe orthopnea"){
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Severe_orthopnea"] = "Yes"
        }
        if( VALUE === "R06.00"){
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Dyspnea"] = "Yes"
        }
        if( VALUE === "R06.01" && EVENT_DESC === "Mild orthopnea"){
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Mild_orthopnea"] = "Yes"
        }
        if( VALUE === "R06.82"){
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Tachypnea"] = "Yes"
        }
        if( VALUE === "R51"){
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["New_or_worsening_headache"] = "Yes"
        }
        if( VALUE === "R07.9"){
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Chest_pain"] = "Yes"
        }
        if( VALUE === "R42 or R55"){
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Dizziness_or_syncope"] = "Yes"
        }
        if( VALUE === "R00.2"){
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Palpitations"] = "Yes"
        }
      }
      
      
    }
    );
    // console.log("details",uniquePersonIllnes);

    // console.log("main object",uniquePersonIllnes);
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

        ////Add Diastolic BP details to Person widget.
        if (EVENT_CD == 102224950) {
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID][
            "Resting_Diastolic_BP"
          ] = RESULT_VAL <= 60 ? "Yes" : "No";
        }
        if (EVENT_CD == "R09.02") {
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID][
            "Oxygen_saturation"
          ] = RESULT_VAL <= 94 ? "Yes" : "No";
        }
      }
    });
    //Prepare final result array from uniquePersonIllnes Object.
    const preparedResult = [];
    for (let PersonID in uniquePersonIllnes) {
      const personDetails = uniquePersonIllnes[PersonID];

      console.log("persondetails",personDetails);
      for (let visitId in personDetails["VISITS"]) {
        const visitDetail = personDetails["VISITS"][visitId];
        preparedResult.push({
          PERSON_ID: personDetails.PERSON_ID,
          VISIT_ID: visitId,
          VISIT_NUMBER: (visitIDMap[visitId] || {}).VISIT_NUMBER || "",
          VISIT_TYPE: (visitIDMap[visitId] || {}).VISIT_TYPE || "",
          REG_DAYS_FROM_INDEX:
            (visitIDMap[visitId] || {}).REG_DAYS_FROM_INDEX || "",
          isAfricanAmerican:
            personDetails.RACE === "African American" ? "Yes" : "No",
          isAgeMoreThan40: personDetails.CURRENT_AGE >= 40 ? "Yes" : "No",

          Resting_Systolic_BP: visitDetail.Resting_Systolic_BP || "NA",
          Resting_Diastolic_BP: visitDetail.Resting_Diastolic_BP || "NA",
          History_of_cardiovascular_disease: visitDetail.History_of_cardiovascular_disease || "NA",
          Swelling_in_face_or_hands: visitDetail.Swelling_in_face_or_hands || "NA",
          Shortness_of_breath_at_rest: visitDetail.Shortness_of_breath_at_rest || "NA",
          Severe_orthopnea:visitDetail.Severe_orthopnea || "NA",
          Dyspnea: visitDetail.Dyspnea || "NA",
          Mild_orthopnea:visitDetail.Mild_orthopnea || "NA",
          Tachypnea:visitDetail.Tachypnea || "NA",
          New_or_worsening_headache:visitDetail.New_or_worsening_headache || "NA",
          Palpitations: visitDetail.Palpitations || "NA",
          Dizziness_or_syncope: visitDetail.Dizziness_or_syncope || "NA",
          Chest_pain:visitDetail.Chest_pain || "NA",
          Oxygen_saturation:visitDetail.Oxygen_saturation || "NA"
        });
      }
    }


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
