"use strict";
const debug = require("debug"),
  express = require("express"),
  logger = require("morgan"),
  cookieParser = require("cookie-parser");
/*********************************************** */
const app = express();

const routes = require("./routes/index");

app.use(logger("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded());
app.use(cookieParser());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use("/", routes);

var sql = require("mssql");
var dbConfig = require("./Database/dbConnection");

const { DiagnosesPointers } = require("./Constant/indexConstants");
const { Medication } = require("./MedicationAdmin.js");
const { EventandDiagTable } = require("./AnalysedTables.js");
// console.log(Medication);
const init = async () => {
  try {
    await sql.connect(dbConfig.dbConnection());
    let personTableData = {};

    const createTableFromPersonData = async ({
      PERSON_ID,
      RACE,
      CURRENT_AGE,
      ETHNICITY,
    }) => {
      let personIdValues = "",
        preparedResult = [],
        uniquePersonIllnes = {};
      // find unique persion id.
      uniquePersonIllnes[PERSON_ID] = {
        RACE,
        CURRENT_AGE,
        PERSON_ID,
        ETHNICITY,
        VISITS: {},
      };

      // Creating person values;
      personIdValues += personIdValues.length
        ? `,${PERSON_ID}`
        : `${PERSON_ID}`;
      // });

      let EventResult = {},
        DiagnosesResult = {},
        visitResult = {};

      EventResult = await sql.query(
        `SELECT * FROM Events Where PERSON_ID IN (${personIdValues})`
      );

      visitResult = await sql.query(
        `SELECT * FROM Visits Where PERSON_ID IN (${personIdValues})`
      );
      DiagnosesResult = await sql.query(
        `SELECT * FROM Diagnoses Where PERSON_ID IN (${personIdValues})`
      );
      // console.log(DiagnosesResult);
      let visitIDMap = {};
      (visitResult.recordset || []).forEach((item) => {
        visitIDMap[item.VISIT_ID] = {
          ...item,
        };
      });
      // let count = 0;
      (DiagnosesResult.recordset || []).forEach((item) => {
        let { VALUE, PERSON_ID, VISIT_ID, EVENT_DESC, RECORDED_DATE } = item;

        if (uniquePersonIllnes[PERSON_ID]) {
          !uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID] &&
            (uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID] = {});
          let visit = uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID];

          VALUE = (VALUE ? VALUE : "").toUpperCase();
          //use refrential variable
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
            VALUE.includes("I10") &&
            !visit["Pre_pregnancy_diagnosis_of_hypertension"]
          ) {
            visit["Pre_pregnancy_diagnosis_of_hypertension"] = "Yes";
            visit["Risk_Factor"]["RiskFactor"] += 1;
            // visit["D_Date"] = RECORDED_DATE;
          }
          if (visit["Diagnoses_Date"] === undefined) {
            visit["Diagnoses_Date"] = RECORDED_DATE;
          } else {
            if (visit["Diagnoses_Date"] > RECORDED_DATE) {
              visit["Diagnoses_Date"] = RECORDED_DATE;
            }
          }
        }
      });

      (EventResult.recordset || []).forEach((item) => {
        let {
          EVENT_ID,
          PERSON_ID,
          VISIT_ID,
          EVENT_CD,
          RESULT_VAL,
          EVENT_DESC = "",
          EVENT_END_DATE,
          CLINICAL_CAT,
        } = item;

        EVENT_CD = Number(EVENT_CD);
        EVENT_DESC = (EVENT_DESC ? EVENT_DESC : "").toLowerCase();
        // RESULT_VAL = Number(RESULT_VAL);
        CLINICAL_CAT = (CLINICAL_CAT ? CLINICAL_CAT : "").toLowerCase();

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

          if (
            CLINICAL_CAT.includes("tobacco") ||
            CLINICAL_CAT.includes("alcohol") ||
            CLINICAL_CAT.includes("other substance")
          ) {
            RESULT_VAL = (RESULT_VAL ? RESULT_VAL : "").toLowerCase();
            if (
              RESULT_VAL.includes("never") ||
              RESULT_VAL.includes("no") ||
              RESULT_VAL.includes("0")
            ) {
            } else {
              if (!visit["History_of_Substance_use"]) {
                visit["History_of_Substance_use"] = "Yes";
                visit["Substance_Cat"] =
                  (CLINICAL_CAT.includes("tobacco") && "Tobacco") ||
                  (CLINICAL_CAT.includes("alcohol") && "Alcohol") ||
                  "Others";
                visit["Risk_Factor"]["RiskFactor"] += 1;
              }
            }
          } else if (EVENT_CD == 102225120) {
            RESULT_VAL = Number(RESULT_VAL);

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
          } else if (EVENT_DESC.includes("heart rate")) {
            RESULT_VAL = Number(RESULT_VAL);

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
            RESULT_VAL = Number(RESULT_VAL);
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
          } else if (
            EVENT_DESC.includes("urine amph scrn") ||
            EVENT_DESC.includes("urine cannab scrn") ||
            EVENT_DESC.includes("urine cocaine met") ||
            EVENT_DESC.includes("urine opiate scrn")
          ) {
            RESULT_VAL = (RESULT_VAL ? RESULT_VAL : "").toLowerCase();
            if (RESULT_VAL.includes("positive") || RESULT_VAL == "detected") {
              if (!visit["History_of_Substance_use"]) {
                visit["History_of_Substance_use"] = "Yes";
                visit["Substance_Cat"] = "Others";
                visit["Risk_Factor"]["RiskFactor"] += 1;
              }
            }
          } else if (EVENT_DESC.includes("body mass index dosing")) {
            RESULT_VAL = Number(RESULT_VAL);
            if (RESULT_VAL >= 35) {
              if (visit["BMI"] === undefined) {
                visit["BMI"] = RESULT_VAL;
                visit["Risk_Factor"]["RiskFactor"] += 1;
              } else {
                if (visit["BMI"] < RESULT_VAL) {
                  visit["BMI"] = RESULT_VAL;
                }
              }
            } else {
              if (visit["BMI"] === undefined) {
                visit["BMI"] = RESULT_VAL;
                // visit["Risk_Factor"]["RiskFactor"] += 1;
              } else {
                if (visit["BMI"] < RESULT_VAL) {
                  visit["BMI"] = RESULT_VAL;
                }
              }
            }
          }
          if (visit["Event_Date"] === undefined) {
            visit["Event_Date"] = EVENT_END_DATE;
          } else {
            if (visit["Event_Date"] > EVENT_END_DATE) {
              visit["Event_Date"] = EVENT_END_DATE;
            }
          }
        }
      });
      //Prepare final result array from uniquePersonIllnes Object.
      for (let PersonID in uniquePersonIllnes) {
        // console.log(uniquePersonIllnes);

        const personDetails = uniquePersonIllnes[PersonID];
        // console.log(personDetails);
        for (let visitId in personDetails["VISITS"]) {
          const visitDetail = personDetails["VISITS"][visitId];
          // console.log("key", visitDetail, visitId, PersonID);
          const currentAge =
              (visitIDMap[visitId] || {}).CURRENT_AGE ||
              personDetails.CURRENT_AGE,
            REG_DAYS_FROM_INDEX =
              (visitIDMap[visitId] || {}).REG_DAYS_FROM_INDEX || -1;
          const result = {
            PERSON_ID: Number(personDetails.PERSON_ID),
            VISIT_ID: Number(visitId),
            VISIT_NUMBER: (visitIDMap[visitId] || {}).VISIT_NUMBER || "--",
            REG_DAYS_FROM_INDEX: REG_DAYS_FROM_INDEX,
            Diagnoses_Date: visitDetail.Diagnoses_Date || 0,
            Event_Date: visitDetail.Event_Date || 0,
            Risk_Cat: visitDetail.Risk_Cat || "--",
            Risk_Factor: "--",
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
            ETHNICITY: personDetails.ETHNICITY || "--",
            BMI: visitDetail.BMI || 0,
            Swelling_in_face_or_hands:
              visitDetail.Swelling_in_face_or_hands || "--",
            Dyspnea: visitDetail.Dyspnea || "--",
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
            History_of_Substance_use:
              visitDetail.History_of_Substance_use || "--",
            Substance_Cat: visitDetail.Substance_Cat || "--",
          };

          if (currentAge >= 40) {
            visitDetail.Risk_Factor.RiskFactor += 1;
          }

          if (!personDetails.RACE) {
            if (personDetails.RACE == "african american") {
              visitDetail.Risk_Factor.RiskFactor += 1;
            }
          } else {
            if (personDetails.RACE.toLowerCase() == "african american") {
              visitDetail.Risk_Factor.RiskFactor += 1;
            }
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
            // console.log(result);
            preparedResult.push(Object.values(result));
          }
        }
      }
      // console.log("result", preparedResult);
      return preparedResult;
    };
    const createTable = async () => {
      let lastProcessedPersonID = 0,
        offset = 0,
        interval = 5;
      // let lastperson = await sql.query(
      // `select max(person_id) person_id from VisitWisePersonDisease`
      // );
      // lastProcessedPersonID = lastperson.recordset[0].person_id;
      // console.log("personid", lastProcessedPersonID);

      for (let j = 0; j < 6000; j++) {
        // console.log("batches processed-----", j);
        personTableData = await sql.query(
          `select PERSON_ID,CURRENT_AGE,RACE,ETHNICITY from Person 
          where  cast(person_id as bigint) >${lastProcessedPersonID || 0}
          order by cast(person_id as bigint) asc OFFSET ${offset}  ROWS
          FETCH NEXT ${interval} ROWS ONLY`
        );
        offset += interval;

        let records = personTableData.recordset;
        // console.log("record", records);
        for (let i = 0; i < records.length; i++) {
          let recordSlice = records[i],
            values = await createTableFromPersonData(recordSlice);
          // console.log("values", values);

          const table = new sql.Table("VisitWisePerson");
          table.create = true;
          table.columns.add("PERSON_ID", sql.BigInt, { nullable: false });
          table.columns.add("VISIT_ID", sql.BigInt, { nullable: false });
          table.columns.add("VISIT_NUMBER", sql.VarChar(sql.MAX), {
            nullable: true,
          });
          table.columns.add("REG_DAYS_FROM_INDEX", sql.BigInt, {
            nullable: true,
          });
          table.columns.add("Diagnoses_Date", sql.BigInt, { nullable: true });
          table.columns.add("Event_Date", sql.BigInt, { nullable: true });
          table.columns.add("Risk_Cat", sql.VarChar(sql.MAX), {
            nullable: true,
          });
          table.columns.add("Risk_Factor", sql.SmallInt, { nullable: true });
          table.columns.add(
            "History_of_cardiovascular_disease",
            sql.VarChar(sql.MAX),
            {
              nullable: true,
            }
          );
          table.columns.add(
            "Shortness_of_breath_at_rest",
            sql.VarChar(sql.MAX),
            {
              nullable: true,
            }
          );
          table.columns.add("Severe_orthopnea", sql.VarChar(sql.MAX), {
            nullable: true,
          });
          table.columns.add("Resting_HR", sql.SmallInt, { nullable: true });
          table.columns.add("Resting_Systolic_BP", sql.SmallInt, {
            nullable: true,
          });
          table.columns.add("Oxygen_saturation", sql.VarChar(sql.MAX), {
            nullable: true,
          });
          table.columns.add("Respiratory_rate", sql.SmallInt, {
            nullable: true,
          });
          table.columns.add("RACE", sql.VarChar(sql.MAX), { nullable: true });
          table.columns.add("Age", sql.SmallInt, { nullable: true });
          table.columns.add("ETHNICITY", sql.VarChar(sql.MAX), {
            nullable: true,
          });
          table.columns.add("BMI", sql.SmallInt, {
            nullable: true,
          });
          table.columns.add("Swelling_in_face_or_hands", sql.VarChar(sql.MAX), {
            nullable: true,
          });
          table.columns.add("Dyspnea", sql.VarChar(sql.MAX), {
            nullable: true,
          });
          table.columns.add("Tachypnea", sql.VarChar(sql.MAX), {
            nullable: true,
          });
          table.columns.add("New_or_worsening_headache", sql.VarChar(sql.MAX), {
            nullable: true,
          });
          table.columns.add("Asthma_unresponsive", sql.VarChar(sql.MAX), {
            nullable: true,
          });
          table.columns.add("Palpitations", sql.VarChar(sql.MAX), {
            nullable: true,
          });
          table.columns.add("Dizziness_or_syncope", sql.VarChar(sql.MAX), {
            nullable: true,
          });
          table.columns.add("Chest_pain", sql.VarChar(sql.MAX), {
            nullable: true,
          });
          table.columns.add("Loud_murmur_heart", sql.VarChar(sql.MAX), {
            nullable: true,
          });
          table.columns.add(
            "Pre_pregnancy_diagnosis_of_diabetes",
            sql.VarChar(sql.MAX),
            {
              nullable: true,
            }
          );
          table.columns.add(
            "Pre_pregnancy_diagnosis_of_hypertension",
            sql.VarChar(sql.MAX),
            { nullable: true }
          );
          table.columns.add("History_of_Substance_use", sql.VarChar(sql.MAX), {
            nullable: true,
          });
          table.columns.add("Substance_Cat", sql.VarChar(sql.MAX), {
            nullable: true,
          });

          values.length &&
            values.forEach((value) => {
              table.rows.add(...value);
            });

          const request = new sql.Request();

          values.length &&
            request.bulk(table, (err, result) => {
              // ... error checks
              if (err) {
                console.log("error in bulk create", err);
                // res.json({ error: err });
              } else if (result) {
                // console.log(result);
              }
            });
        }
      }
    };
    createTable();
    //res.json({ data: "Table created in DB" });
  } catch (err) {
    console.log("Error in query ", err);
  }
};
init();

// Medication();

// EventandDiagTable();

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error("Not Found");
  err.status = 404;
  res.json();
});

// error handlers

app.set("port", process.env.PORT || 7000);
const server = app.listen(app.get("port"), "localhost", function () {
  console.log(" server started with details ", server.address());
  debug("Express server listening on port " + server.address().port);
});
