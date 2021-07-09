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
    // Risk_Factor = {
    //   Symptoms: 0,
    //   Vitals_sign : 0,
    //   Physical_exam : 0
    // };

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

    (DiagnosesResult.recordset || []).forEach((item) => {
      const { VALUE, PERSON_ID, VISIT_ID, EVENT_DESC } = item;
      if (uniquePersonIllnes[PERSON_ID]) {
        !uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID] &&
          (uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID] = {});
        !uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Risk_Factor"] &&
          (uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Risk_Factor"] = {
            Symptoms: 0,
            Vitals_sign: 0,
            Physical_exam: 0,
            RiskFactor: 0,
          });
        if (VALUE === "O99.419") {
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID][
            "History_of_cardiovascular_disease"
          ] = "Yes";
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Risk_Cat"] = "RED";
        }
        if (VALUE === "R09.02") {
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID][
            "Swelling_in_face_or_hands"
          ] = "Yes";
        }
        if (VALUE === "R06.02") {
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID][
            "Shortness_of_breath_at_rest"
          ] = "Yes";
        }
        if (VALUE === "R06.01" && EVENT_DESC === "Severe orthopnea") {
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID][
            "Severe_orthopnea"
          ] = "Yes";
        }
        if (VALUE === "R06.00") {
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Dyspnea"] = "Yes";
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Risk_Factor"][
            "Symptoms"
          ] += 1;
        }
        if (VALUE === "R06.01" && EVENT_DESC === "Mild orthopnea") {
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Mild_orthopnea"] =
            "Yes";
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Risk_Factor"][
            "Symptoms"
          ] += 1;
        }
        if (VALUE === "R06.82") {
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Tachypnea"] =
            "Yes";
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Risk_Factor"][
            "Symptoms"
          ] += 1;
        }
        if (VALUE === "R51") {
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID][
            "New_or_worsening_headache"
          ] = "Yes";
        }
        if (VALUE == "J45") {
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID][
            "Asthma_unresponsive "
          ] = "Yes";
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Risk_Factor"][
            "Symptoms"
          ] += 1;
        }
        if (VALUE === "R07.9") {
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Chest_pain"] =
            "Yes";
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Risk_Factor"][
            "Symptoms"
          ] += 1;
        }
        if (VALUE === "R42 or R55") {
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID][
            "Dizziness_or_syncope"
          ] = "Yes";
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Risk_Factor"][
            "Symptoms"
          ] += 1;
        }
        if (VALUE === "R00.2") {
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Palpitations"] =
            "Yes";
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Risk_Factor"][
            "Symptoms"
          ] += 1;
        }
        if (VALUE === "R01.1") {
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID][
            "Loud_murmur(heart)"
          ] = "Yes";
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Risk_Factor"][
            "Physical_exam"
          ] += 1;
        }
        if (VALUE == "E10" || VALUE == "E11") {
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID][
            "Pre-pregnancy_diagnosis_of_diabetes"
          ] = "Yes";
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Risk_Factor"][
            "Physical_exam"
          ] += 1;
        }
      }
    });
    // console.log("details",uniquePersonIllnes);

    // console.log("main object",uniquePersonIllnes);
    (EventResult.recordset || []).forEach((item) => {
      const {
        EVNET_ID,
        PERSON_ID,
        VISIT_ID,
        EVENT_CD,
        RESULT_VAL,
        EVENT_DESC,
      } = item;
      if (uniquePersonIllnes[PERSON_ID]) {
        // Add Visit_ID wise data to each person.
        !uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID] &&
          (uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID] = {});
        // !uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Risk_Factor"] &&
        // (uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Risk_Factor"] = 0)

        //Add Systolic BP details to Person widget.
        if (EVENT_CD == 102225120) {
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID][
            "Resting_Systolic_BP"
          ] = RESULT_VAL;
          if (RESULT_VAL >= 160) {
            uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Risk_Cat"] =
              "RED";
          }
          if (140 < RESULT_VAL < 159) {
            (uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Risk_Factor"] ||
              {})["Vitals_sign"] += 1;
            // uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Risk_Factor"] += 1;
          }
        }

        ////Add Diastolic BP details to Person widget.
        // if (EVENT_CD == 102224950) {
        //   uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID][
        //     "Resting_Diastolic_BP"
        //   ] = RESULT_VAL ;
        // }
        if (EVENT_CD == "R09.02") {
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID][
            "Oxygen_saturation"
          ] = RESULT_VAL;
          if (RESULT_VAL <= 94) {
            uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Risk_Cat"] =
              "RED";
          }
          if (94 < RESULT_VAL < 97) {
            uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Risk_Factor"][
              "Vitals_sign"
            ] += 1;
            // uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Risk_Factor"] += 1;
          }
        }
        if (EVENT_CD == 9989898654) {
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Resting_HR"] =
            RESULT_VAL;
          if (RESULT_VAL >= 120) {
            uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Risk_Cat"] =
              "RED";
          }
          if (110 < RESULT_VAL < 119) {
            uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Risk_Factor"][
              "Vitals_sign"
            ] += 1;

            // uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Risk_Factor"] += 1;
          }
        }
        if (EVENT_DESC == "heart rate") {
          uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID][
            "Respiratory_rate"
          ] = RESULT_VAL;
          if (RESULT_VAL >= 30) {
            uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Risk_Cat"] =
              "RED";
          }
          if (24 < RESULT_VAL <= 29) {
            uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Risk_Factor"][
              "Vitals_sign"
            ] += 1;

            // uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Risk_Factor"] += 1;
          }
        }
      }
    });
    //Prepare final result array from uniquePersonIllnes Object.
    const preparedResult = [];
    for (let PersonID in uniquePersonIllnes) {
      const personDetails = uniquePersonIllnes[PersonID];

      for (let visitId in personDetails["VISITS"]) {
        // console.log("persondetails",personDetails["VISITS"][visitId]["Risk_Factor"]);
        const visitDetail = personDetails["VISITS"][visitId];
        console.log(visitDetail);
        const result = {
          PERSON_ID: personDetails.PERSON_ID,
          VISIT_ID: visitId,
          VISIT_NUMBER: (visitIDMap[visitId] || {}).VISIT_NUMBER || "",
          VISIT_TYPE: (visitIDMap[visitId] || {}).VISIT_TYPE || "",
          REG_DAYS_FROM_INDEX:
            (visitIDMap[visitId] || {}).REG_DAYS_FROM_INDEX || "",
          Risk_Cat: visitDetail.Risk_Cat || "NA",
          Risk_Factor: 0,
          History_of_cardiovascular_disease:
            visitDetail.History_of_cardiovascular_disease || "NA",
          Shortness_of_breath_at_rest:
            visitDetail.Shortness_of_breath_at_rest || "NA",
          Severe_orthopnea: visitDetail.Severe_orthopnea || "NA",
          Resting_HR: visitDetail.Resting_HR || "NA",
          Resting_Systolic_BP: visitDetail.Resting_Systolic_BP || "NA",
          Oxygen_saturation: visitDetail.Oxygen_saturation || "NA",
          isAfricanAmerican:
            personDetails.RACE === "African American" ? "Yes" : "No",
          isAgeMoreThan40: personDetails.CURRENT_AGE >= 40 ? "Yes" : "No",
          Swelling_in_face_or_hands:
            visitDetail.Swelling_in_face_or_hands || "NA",
          Dyspnea: visitDetail.Dyspnea || "NA",
          Mild_orthopnea: visitDetail.Mild_orthopnea || "NA",
          Tachypnea: visitDetail.Tachypnea || "NA",
          New_or_worsening_headache:
            visitDetail.New_or_worsening_headache || "NA",
          Asthma_unresponsive: visitDetail.Asthma_unresponsive || "NA",
          Palpitations: visitDetail.Palpitations || "NA",
          Dizziness_or_syncope: visitDetail.Dizziness_or_syncope || "NA",
          Chest_pain: visitDetail.Chest_pain || "NA",
        };

        //  calculating risk category and risk factor count

        if (visitDetail.Risk_Factor) {
          const { Symptoms, Vitals_sign, RiskFactor } = visitDetail.Risk_Factor;
          let totalRisk = Symptoms + RiskFactor + Vitals_sign;
          result.Risk_Factor = totalRisk || "NA";
          if (visitDetail.Risk_Cat !== "RED") {
            result.Risk_Cat =
              (Symptoms > 1 && Vitals_sign > 1 && RiskFactor > 1) ||
              (totalRisk > 4 && "RED") ||
              "NA";
          }
        }

        preparedResult.push(result);
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
