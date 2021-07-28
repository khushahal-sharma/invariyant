"use strict";
const debug = require("debug"),
  express = require("express"),
  path = require("path"),
  favicon = require("serve-favicon"),
  logger = require("morgan"),
  cookieParser = require("cookie-parser");
/*********************************************** */
//var express = require("express");
var router = express.Router();

var sql = require("mssql");
var dbConfig = require("./Database/dbConnection");

const { DiagnosesPointers } = require("./Constant/indexConstants");

//router.get("/runPersonApi", async function (req, res)
const init = async () => {
  try {
    await sql.connect(dbConfig.dbConnection());
    let result = {};

    let offset = 0,
      interval = 5;

    const createTableFromPersonID = async ({
      PERSON_ID,
      RACE,
      CURRENT_AGE,
    }) => {
      let personIdValues = "",
        preparedResult = [],
        uniquePersonIllnes = {};
      // find unique persion id.
      // (recordSlice || []).forEach(({ PERSON_ID, RACE, CURRENT_AGE } = {}) => {
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

      //preapare Visit map with details.
      let visitIDMap = {};
      (visitResult.recordset || []).forEach((item) => {
        visitIDMap[item.VISIT_ID] = {
          ...item,
        };
      });

      (DiagnosesResult.recordset || []).forEach((item) => {
        let { VALUE, PERSON_ID, VISIT_ID, EVENT_DESC } = item;
        if (uniquePersonIllnes[PERSON_ID]) {
          !uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID] &&
            (uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID] = {});

          VALUE = VALUE.toUpperCase();
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
            VALUE.includes("I10") &&
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

        EVENT_CD = Number(EVENT_CD);
        EVENT_DESC = EVENT_DESC.toLowerCase();
        RESULT_VAL = Number(RESULT_VAL);

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
          } else if (EVENT_DESC.includes("heart rate")) {
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
      for (let PersonID in uniquePersonIllnes) {
        const personDetails = uniquePersonIllnes[PersonID];
        // console.log(personDetails);
        for (let visitId in personDetails["VISITS"]) {
          const visitDetail = personDetails["VISITS"][visitId],
            currentAge =
              (visitIDMap[visitId] || {}).CURRENT_AGE ||
              personDetails.CURRENT_AGE;
          const result = {
            PERSON_ID: Number(personDetails.PERSON_ID),
            VISIT_ID: Number(visitId),
            // VISIT_NUMBER:
            //   Number((visitIDMap[visitId] || {}).VISIT_NUMBER) || null,
            // VISIT_TYPE: (visitIDMap[visitId] || {}).VISIT_TYPE || "",
            // REG_DAYS_FROM_INDEX:
            //   (visitIDMap[visitId] || {}).REG_DAYS_FROM_INDEX || "",
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

          if (personDetails.RACE.toLowerCase() == "african american") {
            visitDetail.Risk_Factor.RiskFactor += 1;
          }
          //  calculating risk category and risk factor count

          if (visitDetail.Risk_Factor) {
            const { Symptoms, Vitals_sign, RiskFactor, Physical_exam } =
              visitDetail.Risk_Factor;
            let totalRisk = Symptoms + RiskFactor + Vitals_sign + Physical_exam;
            // console.log('Symptoms',Symptoms,"RiskFactor",RiskFactor,"VitalSign", Vitals_sign,"Physical exam",Physical_exam);
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
            preparedResult.push(Object.values(result));
          }
        }
      }
      // console.log("result", preparedResult);
      return preparedResult;
    };
    const loopFunction = async () => {
      let lastProcessedPersonID = 0;
      // let lastperson = await sql.query(
      //   `select max(person_id) person_id from VisitWisePersonDisease`
      // );
      // lastProcessedPersonID = lastperson.recordset[0].person_id;
      // console.log("personid", lastProcessedPersonID);
      for (let j = 0; j < 10; j++) {
        console.log("batches processed-----", j);
        result = await sql.query(
          `select PERSON_ID,CURRENT_AGE,RACE from Person 
          where  cast(person_id as bigint) >${lastProcessedPersonID || 0} 
          order by cast(person_id as bigint) desc OFFSET ${offset}  ROWS
        FETCH NEXT ${interval} ROWS ONLY`
        );
        offset += interval;
        // interval += 5;
        //console.log("result", result);

        let record = result.recordset;
        // console.log("record", record);
        for (let i = 0; i < record.length; i++) {
          let recordSlice = record[i],
            values = await createTableFromPersonID(recordSlice);
          //console.log("slice", recordSlice);
          // console.log("values", values);

          const table = new sql.Table("VisitWisePersonDisease");
          table.create = true;
          table.columns.add("PERSON_ID", sql.BigInt, { nullable: false });
          table.columns.add("VISIT_ID", sql.BigInt, { nullable: false });
          // table.columns.add("VISIT_NUMBER", sql.BigInt, { nullable: false });
          table.columns.add("Risk_Cat", sql.VarChar(sql.MAX), { nullable: true });
          table.columns.add("Risk_Factor", sql.SmallInt, { nullable: true });
          table.columns.add(
            "History_of_cardiovascular_disease",
            sql.VarChar(sql.MAX),
            {
              nullable: true,
            }
          );
          table.columns.add("Shortness_of_breath_at_rest", sql.VarChar(sql.MAX), {
            nullable: true,
          });
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
          table.columns.add("Swelling_in_face_or_hands", sql.VarChar(sql.MAX), {
            nullable: true,
          });
          table.columns.add("Dyspnea", sql.VarChar(sql.MAX), { nullable: true });
          table.columns.add("Tachypnea", sql.VarChar(sql.MAX), { nullable: true });
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
          table.columns.add("Chest_pain", sql.VarChar(sql.MAX), { nullable: true });
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

          values.forEach((value) => {
            table.rows.add(...value);
          });
          console.log('code working till here-------------------', table);
          const request = new sql.Request();
          result = await sql.create(`INSERT INTO VisitWisePersonDisease (PERSON_ID, VISIT_ID, Risk_Cat, Risk_Factor)
          VALUES (1, 5, 'rh12', 8)`);
          //   `select PERSON_ID,CURRENT_AGE,RACE from Person 
          //   where  cast(person_id as bigint) >${lastProcessedPersonID || 0} 
          //   order by cast(person_id as bigint) desc OFFSET ${offset}  ROWS
          // FETCH NEXT ${interval} ROWS ONLY`

          // request.bulk(table, (err, result) => {
          //   // ... error checks
          //   if (err) {
          //     console.log("error in bulk create", err);
          //     // res.json({ error: err });
          //   } else if (result) {
          //     // console.log(result);
          //   }
          // });
        }
      }
    };
    result = await loopFunction();
    //res.json({ data: "Table created in DB" });
  } catch (err) {
    console.log("Error in query ", err);
  }
};
init();
/*********************************************** */ return;
const routes = require("./routes/index"),
  users = require("./routes/users"),
  dumpTable = require("./routes/dumpTable");

// /prepareDataset
const app = express();

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
app.use("/users", users);
app.use("/", dumpTable);

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
