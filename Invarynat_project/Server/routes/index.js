"use strict";
var express = require("express");
var router = express.Router();

var sql = require("mssql");
var dbConfig = require("../Database/dbConnection");

const { DiagnosesPointers } = require("../Constant/indexConstants");

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
  let VAL = req.query.VALUE,
    Person_ID = req.query.Person;
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
        "233":
        
        }
      }
    }}
     */

    let result = {},
      uniquePersonIllnes = {},
      personIdValues = "";

    if (Person_ID) {
      let checkPreparedPersonId = false;
      console.log("Person_ID", Person_ID);
      let preparePersonIds = "";

      Person_ID.split(",").forEach((id, index) => {
        preparePersonIds += `${index > 0 ? "," : ""}` + id;

        isNaN(id) && (checkPreparedPersonId = true);
      });
      //   console.log('checkPreparedPersonId',typeof(checkPreparedPersonId),checkPreparedPersonId,checkPreparedPersonId.includes(isNaN()))

      if (checkPreparedPersonId) {
        console.log(" Error: Person ID is not in Integer formate");
       return res.json({ error: "Error: Person ID is not in Integer formate" });  
      }
      result = await sql.query(
        `SELECT Top 50 * FROM Person WHERE PERSON_ID IN (${preparePersonIds})`
      );
    } else {
      result = await sql.query(`SELECT Top 100 * FROM Person`);
    }
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

    let EventResult = {},
      DiagnosesResult = {},
      visitResult = {};

    if (VAL) {
      DiagnosesResult = await sql.query(
        `SELECT * FROM Diagnoses Where PERSON_ID IN (${personIdValues}) and VALUE IN ('${VAL}')`
      );
      EventResult = await sql.query(
        `SELECT * from Events where PERSON_ID IN (${personIdValues}) and EVENT_CD IN ('${VAL}')`
      );
      EventResult = await sql.query(
        `SELECT * from Events where PERSON_ID IN (${personIdValues}) and EVENT_DESC IN ('${VAL}')`
      );
    } else {
      if (personIdValues.length) {
        EventResult = await sql.query(
          `SELECT * FROM Events Where PERSON_ID IN (${personIdValues})`
        );

        visitResult = await sql.query(
          `SELECT * FROM Visits Where PERSON_ID IN (${personIdValues})`
        );
        DiagnosesResult = await sql.query(
          `SELECT * FROM Diagnoses Where PERSON_ID IN (${personIdValues})`
        );
      }
    }

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

        if (DiagnosesPointers[VALUE]) {
          const { pointerkey, pointerValue, riskCategory, riskFactor } =
            DiagnosesPointers[VALUE];
          if (!visit[pointerkey]) {
            visit[pointerkey] = pointerValue || "Yes";
            riskCategory && (visit["Risk_Cat"] = riskCategory);

            if (riskFactor) {
              Object.keys(riskFactor).forEach((factor) => {
                visit["Risk_Factor"][factor] += 1;
              });
            }
          }
        } else if (VALUE == "R06.01" && !visit["Severe_orthopnea"]) {
          visit["Severe_orthopnea"] = "Yes";
          visit["Risk_Cat"] = "RED";
          // Not sure need to confirm
          // visit["Risk_Factor"]["Symptoms"] += 1;
        } else if (VALUE.includes("E10") || VALUE.includes("E11")) {
          if (!visit["Pre_pregnancy_diagnosis_of_diabetes"]) {
            visit["Pre_pregnancy_diagnosis_of_diabetes"] = "Yes";
            visit["Risk_Factor"]["RiskFactor"] += 1;
          }
        } else if (
          VALUE.includes("i10") &&
          !visit["Pre_pregnancy_diagnosis_of_hypertension"]
        ) {
          visit["Pre_pregnancy_diagnosis_of_hypertension"] = "Yes";
          visit["Risk_Factor"]["RiskFactor"] += 1;
        }
      }
    });

    (EventResult.recordset || []).forEach((item) => {
      let {
        EVNET_ID,
        PERSON_ID,
        VISIT_ID,
        EVENT_CD,
        RESULT_VAL,
        EVENT_DESC = "",
      } = item;

      EVENT_DESC = EVENT_DESC.toLowerCase();

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
          if (!visit["Resting_Systolic_BP"]) {
            visit["Resting_Systolic_BP"] = RESULT_VAL;
            if (RESULT_VAL >= 160) {
              visit["Risk_Cat"] = "RED";
            } else if (RESULT_VAL >= 140) {
              (visit["Risk_Factor"] || {})["Vitals_sign"] += 1;
            }
          } else if (visit["Resting_Systolic_BP"]) {
            if (visit["Resting_Systolic_BP"] < RESULT_VAL) {
              if (RESULT_VAL >= 160) {
                if (visit["Resting_Systolic_BP"] >= 160) {
                  visit["Resting_Systolic_BP"] = RESULT_VAL;
                } else if (visit["Resting_Systolic_BP"] >= 140) {
                  visit["Resting_Systolic_BP"] = RESULT_VAL;
                  visit["Risk_Cat"] = "RED";
                  visit["Risk_Factor"]["Vitals_sign"] -= 1;
                } else {
                  visit["Resting_Systolic_BP"] = RESULT_VAL;
                  visit["Risk_Cat"] = "RED";
                }
              } else if (RESULT_VAL >= 140) {
                if (visit["Resting_Systolic_BP"] >= 140) {
                  visit["Resting_Systolic_BP"] = RESULT_VAL;
                } else {
                  visit["Resting_Systolic_BP"] = RESULT_VAL;
                  visit["Risk_Factor"]["Vitals_sign"] += 1;
                }
              } else {
                visit["Resting_Systolic_BP"] = RESULT_VAL;
              }
            }
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
          if (!visit["Resting_HR"]) {
            visit["Resting_HR"] = RESULT_VAL;
            if (RESULT_VAL >= 120) {
              visit["Risk_Cat"] = "RED";
            } else if (RESULT_VAL >= 110) {
              visit["Risk_Factor"]["Vitals_sign"] += 1;
            }
          } else if (visit["Resting_HR"]) {
            if (visit["Resting_HR"] < RESULT_VAL) {
              if (RESULT_VAL >= 120) {
                if (visit["Resting_HR"] >= 120) {
                  visit["Resting_HR"] = RESULT_VAL;
                } else if (visit["Resting_HR"] >= 110) {
                  visit["Resting_HR"] = RESULT_VAL;
                  visit["Risk_Cat"] = "RED";
                  visit["Risk_Factor"]["Vitals_sign"] -= 1;
                } else {
                  visit["Resting_HR"] = RESULT_VAL;
                  visit["Risk_Cat"] = "RED";
                }
              } else if (RESULT_VAL >= 110) {
                if (visit["Resting_HR"] >= 110) {
                  visit["Resting_HR"] = RESULT_VAL;
                } else {
                  visit["Resting_HR"] = RESULT_VAL;
                  visit["Risk_Factor"]["Vitals_sign"] += 1;
                }
              } else {
                visit["Resting_HR"] = RESULT_VAL;
              }
            }
          }
        } else if (EVENT_DESC.includes("respiratory rate")) {
          if (!visit["Respiratory_rate"]) {
            visit["Respiratory_rate"] = RESULT_VAL;
            if (RESULT_VAL >= 30) {
              visit["Risk_Cat"] = "RED";
            } else if (RESULT_VAL >= 24) {
              visit["Risk_Factor"]["Vitals_sign"] += 1;
            }
          } else if (visit["Respiratory_rate"]) {
            if (visit["Respiratory_rate"] < RESULT_VAL) {
              if (RESULT_VAL >= 30) {
                if (visit["Respiratory_rate"] >= 30) {
                  visit["Respiratory_rate"] = RESULT_VAL;
                } else if (visit["Respiratory_rate"] >= 24) {
                  visit["Respiratory_rate"] = RESULT_VAL;
                  visit["Risk_Cat"] = "RED";
                  visit["Risk_Factor"]["Vitals_sign"] -= 1;
                } else {
                  visit["Respiratory_rate"] = RESULT_VAL;
                  visit["Risk_Cat"] = "RED";
                }
              } else if (RESULT_VAL >= 24) {
                if (visit["Respiratory_rate"] >= 24) {
                  visit["Respiratory_rate"] = RESULT_VAL;
                } else {
                  visit["Respiratory_rate"] = RESULT_VAL;
                  visit["Risk_Factor"]["Vitals_sign"] += 1;
                }
              } else {
                visit["Respiratory_rate"] = RESULT_VAL;
              }
            }
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
          Risk_Cat: visitDetail.Risk_Cat || "--",
          Risk_Factor: 0,
          History_of_cardiovascular_disease:
            visitDetail.History_of_cardiovascular_disease || "--",
          Shortness_of_breath_at_rest:
            visitDetail.Shortness_of_breath_at_rest || "--",
          Severe_orthopnea: visitDetail.Severe_orthopnea || "--",
          Resting_HR: visitDetail.Resting_HR || "--",
          Resting_Systolic_BP: visitDetail.Resting_Systolic_BP || "--",
          Oxygen_saturation: visitDetail.Oxygen_saturation || "--",
          Respiratory_rate: visitDetail.Respiratory_rate || "--",
          RACE: personDetails.RACE,
          Age: currentAge,
          Swelling_in_face_or_hands:
            visitDetail.Swelling_in_face_or_hands || "--",
          Dyspnea: visitDetail.Dyspnea || "--",
          //Mild_orthopnea: visitDetail.Mild_orthopnea || "--", removed till get full
          Tachypnea: visitDetail.Tachypnea || "--",
          New_or_worsening_headache:
            visitDetail.New_or_worsening_headache || "--",
          Asthma_unresponsive: visitDetail.Asthma_unresponsive || "--",
          Palpitations: visitDetail.Palpitations || "--",
          Dizziness_or_syncope: visitDetail.Dizziness_or_syncope || "--",
          Chest_pain: visitDetail.Chest_pain || "--",
          Loud_murmur_heart: visitDetail.Loud_murmur_heart || "--",
          Pre_pregnancy_diagnosis_of_diabetes:
            visitDetail.Pre_pregnancy_diagnosis_of_diabetes || "--",
          Pre_pregnancy_diagnosis_of_hypertension:
            visitDetail.Pre_pregnancy_diagnosis_of_hypertension || "--",
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
          result.Risk_Factor = totalRisk || "--";
          if (visitDetail.Risk_Cat !== "RED") {
            result.Risk_Cat =
              (Symptoms >= 1 && Vitals_sign >= 1 && RiskFactor >= 1) ||
              totalRisk >= 4
                ? "RED"
                : "--";
          }
        }

        if (
          result.Risk_Cat == "RED" ||
          (result.Risk_Factor && result.Risk_Factor != "--")
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
