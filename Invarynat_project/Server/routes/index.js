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

      return sql.query("SELECT TOP 1 * FROM Person");
    })
    .then((result) => {
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

    let result = await sql.query("SELECT Top 20 * FROM Person"),
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

        //use refrential variable
        let visit = uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID];
        !visit["Risk_Factor"] &&
          (visit["Risk_Factor"] = {
            Symptoms: 0,
            Vitals_sign: 0,
            Physical_exam: 0,
            RiskFactor: 0,
          });

        if (VALUE == "O99.419") {
          visit["History_of_cardiovascular_disease"] = "Yes";
          visit["Risk_Cat"] = "RED";
        } else if (VALUE == "R60.9") {
          visit["Swelling_in_face_or_hands"] = "Yes";
          // Not sure need to confirm
          //visit["Risk_Factor"]["Symptoms"] += 1;
        } else if (VALUE == "R06.02") {
          visit["Shortness_of_breath_at_rest"] = "Yes";
          visit["Risk_Cat"] = "RED";
          // Not sure need to confirm
          // visit["Risk_Factor"]["Symptoms"] += 1;
        } else if (
          VALUE == "R06.01" &&
          EVENT_DESC.includes("Severe orthopnea")
        ) {
          visit["Severe_orthopnea"] = "Yes";
          visit["Risk_Cat"] = "RED";
          // Not sure need to confirm
          // visit["Risk_Factor"]["Symptoms"] += 1;
        } 
        // else if (VALUE == "R06.01" && EVENT_DESC.includes("Mild orthopnea")) {
        //   visit["Mild_orthopnea"] = "Yes";
        //   visit["Risk_Factor"]["Symptoms"] += 1;
        // } 
        else if (VALUE == "R06.00") {
          visit["Dyspnea"] = "Yes";
          visit["Risk_Factor"]["Symptoms"] += 1;
        } else if (VALUE == "R06.82") {
          visit["Tachypnea"] = "Yes";
          visit["Risk_Factor"]["Symptoms"] += 1;
        } else if (VALUE == "R51") {
          visit["New_or_worsening_headache"] = "Yes";
          // Not sure need to confirm
          //visit["Risk_Factor"]["Symptoms"] += 1;
        } else if (VALUE.includes("J45")) {
          visit["Asthma_unresponsive"] = "Yes";
          visit["Risk_Factor"]["Symptoms"] += 1;
        } else if (VALUE == "R07.9") {
          visit["Chest_pain"] = "Yes";
          visit["Risk_Factor"]["Symptoms"] += 1;
        } else if (VALUE == "R42" || VALUE == "R55") {
          if (!visit["Dizziness_or_syncope"]) {
            visit["Dizziness_or_syncope"] = "Yes";
            visit["Risk_Factor"]["Symptoms"] += 1;
          }
        } else if (VALUE == "R00.2") {
          visit["Palpitations"] = "Yes";
          visit["Risk_Factor"]["Symptoms"] += 1;
        } else if (VALUE == "R01.1") {
          visit["Loud_murmur_heart"] = "Yes";
          visit["Risk_Factor"]["Physical_exam"] += 1;
        } else if (VALUE.includes("E10") || VALUE.includes("E11")) {
          if (!visit["Pre_pregnancy_diagnosis_of_diabetes"]) {
            visit["Pre_pregnancy_diagnosis_of_diabetes"] = "Yes";
            visit["Risk_Factor"]["RiskFactor"] += 1;
          }
        } else if (VALUE.includes("i10")) {
          visit["Pre_pregnancy_diagnosis_of_hypertension"] = "Yes";
          visit["Risk_Factor"]["RiskFactor"] += 1;
        } else if (VALUE == "R09.02") {
          // value is not present in diagnosis value only yes if found.
          visit["Oxygen_saturation"] = "<=94";
          visit["Risk_Cat"] = "RED";
        }
      }
    });

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

        let visit = uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID];
        // defesive check for risk factors
        !visit["Risk_Factor"] &&
          (visit["Risk_Factor"] = {
            Symptoms: 0,
            Vitals_sign: 0,
            Physical_exam: 0,
            RiskFactor: 0,
          });

        //Add Systolic BP details to Person widget.
        if (EVENT_CD == 102225120) {
          visit["Resting_Systolic_BP"] = RESULT_VAL;
          if (RESULT_VAL >= 160) {
            visit["Risk_Cat"] = "RED";
          } else if (RESULT_VAL >= 140) {
            (visit["Risk_Factor"] || {})["Vitals_sign"] += 1;
          }
        }

        ////Add Diastolic BP details to Person widget.
        // if (EVENT_CD == 102224950) {
        //   uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID][
        //     "Resting_Diastolic_BP"
        //   ] = RESULT_VAL ;
        // }
        //------------------------------
        //incorrect code - oxygen saturation to come from diagnosis not from events
        // if (EVENT_CD == "R09.02") {
        //   uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID][
        //     "Oxygen_saturation"
        //   ] = RESULT_VAL;
        //   if (RESULT_VAL <= 94) {
        //     uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Risk_Cat"] =
        //       "RED";
        //   }
        //   else if (96 <= RESULT_VAL) {
        //     uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Risk_Factor"][
        //       "Vitals_sign"
        //     ] += 1;
        //     // uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID]["Risk_Factor"] += 1;
        //   }
        // }
        //------------------------------
        else if (EVENT_DESC.includes("heart rate")) {
          visit["Resting_HR"] = RESULT_VAL;
          if (RESULT_VAL >= 120) {
            visit["Risk_Cat"] = "RED";
          } else if (RESULT_VAL >= 110) {
            visit["Risk_Factor"]["Vitals_sign"] += 1;
          }
        } else if (EVENT_DESC.includes("Respiratory rate")) {
          visit["Respiratory_rate"] = RESULT_VAL;
          if (RESULT_VAL >= 30) {
            visit["Risk_Cat"] = "RED";
          } else if (RESULT_VAL >= 24) {
            visit["Risk_Factor"]["Vitals_sign"] += 1;
          }
        }
      }
    });

    //Prepare final result array from uniquePersonIllnes Object.
    const preparedResult = [];
    for (let PersonID in uniquePersonIllnes) {
      const personDetails = uniquePersonIllnes[PersonID];

      for (let visitId in personDetails["VISITS"]) {
        const visitDetail = personDetails["VISITS"][visitId],
          currentAge =
            (visitIDMap[visitId] || {}).CURRENT_AGE ||
            personDetails.CURRENT_AGE;

        const result = {
          PERSON_ID: personDetails.PERSON_ID,
          VISIT_ID: visitId,
          VISIT_NUMBER: (visitIDMap[visitId] || {}).VISIT_NUMBER || "",
          // VISIT_TYPE: (visitIDMap[visitId] || {}).VISIT_TYPE || "",
          // REG_DAYS_FROM_INDEX:
          //   (visitIDMap[visitId] || {}).REG_DAYS_FROM_INDEX || "",
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
          Respiratory_rate: visitDetail.Respiratory_rate || "NA",
          RACE: personDetails.RACE,
          Age: currentAge,
          Swelling_in_face_or_hands:
            visitDetail.Swelling_in_face_or_hands || "NA",
          Dyspnea: visitDetail.Dyspnea || "NA",
          //Mild_orthopnea: visitDetail.Mild_orthopnea || "NA", removed till get full
          Tachypnea: visitDetail.Tachypnea || "NA",
          New_or_worsening_headache:
            visitDetail.New_or_worsening_headache || "NA",
          Asthma_unresponsive: visitDetail.Asthma_unresponsive || "NA",
          Palpitations: visitDetail.Palpitations || "NA",
          Dizziness_or_syncope: visitDetail.Dizziness_or_syncope || "NA",
          Chest_pain: visitDetail.Chest_pain || "NA",
          Loud_murmur_heart: visitDetail.Loud_murmur_heart || "NA",
          Pre_pregnancy_diagnosis_of_diabetes:
            visitDetail.Pre_pregnancy_diagnosis_of_diabetes || "NA",
          Pre_pregnancy_diagnosis_of_hypertension:
            visitDetail.Pre_pregnancy_diagnosis_of_hypertension || "NA",
        };

        if (currentAge >= 40) {
          visitDetail.Risk_Factor.RiskFactor += 1;
        }
        if (personDetails.RACE == "African American") {
          visitDetail.Risk_Factor.RiskFactor += 1;
        }
        //  calculating risk category and risk factor count

        if (visitDetail.Risk_Factor) {
          const { Symptoms, Vitals_sign, RiskFactor, Physical_exam } =
            visitDetail.Risk_Factor;
          let totalRisk = Symptoms + RiskFactor + Vitals_sign + Physical_exam;
          result.Risk_Factor = totalRisk || "NA";
          if (visitDetail.Risk_Cat !== "RED") {
            result.Risk_Cat =
              (Symptoms >= 1 && Vitals_sign >= 1 && RiskFactor >= 1) ||
              totalRisk >= 4
                ? "RED"
                : "NA";
          }
        }

        if (
          result.Risk_Cat == "RED" ||
          (result.Risk_Factor && result.Risk_Factor != "NA")
        ) {
          preparedResult.push(result);
        }
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
