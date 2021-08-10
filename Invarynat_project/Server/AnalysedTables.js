// "use strict";
// const debug = require("debug"),
//   express = require("express"),
//   logger = require("morgan"),
//   cookieParser = require("cookie-parser");
// /*********************************************** */
// const app = express();

// const routes = require("./routes/index");

// app.use(logger("dev"));
// app.use(express.json({ limit: "50mb" }));
// app.use(express.urlencoded());
// app.use(cookieParser());

// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader(
//     "Access-Control-Allow-Methods",
//     "OPTIONS, GET, POST, PUT, PATCH, DELETE"
//   );
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
//   next();
// });

// app.use("/", routes);

var sql = require("mssql");
var dbConfig = require("./Database/dbConnection");

// const { DiagnosesPointers } = require("./Constant/indexConstants");

const init = async () => {
  try {
    await sql.connect(dbConfig.dbConnection());
    let personIDs = {};

    const createTableFromPersonID = async ({ PERSON_ID }) => {
      let personIdValues = "",
        preparedResult = {
          DiagnosesTableData: [],
          EventTableData: [],
          MedicationAdminTableData: [],
          VisitDRGTableData: [],
        },
        uniquePersonIllnes = {
          DiagnosesTableData: {},
          EventTableData: {},
          MedicationAdminTableData: {},
          VisitDRGTableData: {},
        };
      let visitTabledata = {};

      // find unique persion id.
      uniquePersonIllnes["DiagnosesTableData"][PERSON_ID] = [];
      uniquePersonIllnes["EventTableData"][PERSON_ID] = [];
      uniquePersonIllnes["MedicationAdminTableData"][PERSON_ID] = [];
      uniquePersonIllnes["VisitDRGTableData"][PERSON_ID] = [];

      // Creating person values;
      personIdValues += personIdValues.length
        ? `,${PERSON_ID}`
        : `${PERSON_ID}`;
      // });

      let EventResult = {},
        DiagnosesResult = {},
        visitResult = {},
        MedicationAdminResult = {};
      // console.log("personid", PERSON_ID);

      EventResult = await sql.query(
        `SELECT * FROM Events Where PERSON_ID IN (${PERSON_ID})
        and EVENT_DESC  in (
          'UA Protein',
          'pre-pregnancy weight',
          'cumulative weight gain',
          'Body mass index dosing',
          'Edema'
          )`
      );

      visitResult = await sql.query(
        `SELECT PERSON_ID,VISIT_ID,REASON_FOR_VISIT,ZIP_TYPE,VISIT_NUMBER FROM Visits Where PERSON_ID IN (${personIdValues})`
      );

      DiagnosesResult = await sql.query(
        `select * from Diagnoses where PERSON_ID IN (${PERSON_ID})
        and EVENT_DESC not like '%Hemorrhoids%'  
        and EVENT_DESC not like '%scar%'  
        and EVENT_DESC not like '%laceration%'  
        and EVENT_DESC not like '%perineal%'  
        and EVENT_DESC not like '%screening%'  
        and EVENT_DESC not like '%post-term%'
        and EVENT_DESC <> '%Other specified pregnancy related conditions%'  order by RECORDED_DATE`
      );
      // and EVENT_DESC like '%Other specified pregnancy related conditions%'  order by RECORDED_DATE`

      // console.log("result", DiagnosesResult);
      (visitResult.recordset || []).forEach((item) => {
        let { PERSON_ID, VISIT_ID, VISIT_NUMBER, REASON_FOR_VISIT, ZIP_TYPE } =
          item;
        // console.log(item);
        if (!(visitTabledata[PERSON_ID] || {})[VISIT_ID]) {
          if (!visitTabledata[PERSON_ID]) {
            visitTabledata[PERSON_ID] = {};
          }
          visitTabledata[PERSON_ID][VISIT_ID] = {};
        }
        // console.log(visitTabledata);
        let visit = uniquePersonIllnes["EventTableData"][PERSON_ID];
        visitTabledata[PERSON_ID][VISIT_ID]["VISIT_NUMBER"] = VISIT_NUMBER;
        visitTabledata[PERSON_ID][VISIT_ID]["ZIP_TYPE"] = ZIP_TYPE;
        visitTabledata[PERSON_ID][VISIT_ID]["REASON_FOR_VISIT"] =
          REASON_FOR_VISIT;
      });

      (DiagnosesResult.recordset || []).forEach((item) => {
        let {
          VALUE,
          PERSON_ID,
          VISIT_ID,
          EVENT_DESC,
          RECORDED_DATE,
          DIAG_DATE,
          DIAG_ID,
        } = item;
        // console.log("itme", item);
        if (uniquePersonIllnes["DiagnosesTableData"][PERSON_ID]) {
          let visit = uniquePersonIllnes["DiagnosesTableData"][PERSON_ID];

          let visitWiseData = {};
          visitWiseData["PERSON_ID"] = PERSON_ID;
          visitWiseData["VISIT_ID"] = VISIT_ID;
          visitWiseData["DIAG_ID"] = Number(DIAG_ID);
          visitWiseData["RECORDED_DATE"] = RECORDED_DATE;
          visitWiseData["DIAG_DATE"] = DIAG_DATE ? DIAG_DATE : 0;
          visitWiseData["VALUE"] = VALUE;
          visitWiseData["EVENT_DESC"] = EVENT_DESC ? EVENT_DESC : "";
          // visitWiseData["EVENT_DESC"] = EVENT_DESC ? EVENT_DESC : "";
          // visitWiseData["EVENT_DESC"] = EVENT_DESC ? EVENT_DESC : "";

          visit.push(visitWiseData);
        }
      });

      (EventResult.recordset || []).forEach((item) => {
        let {
          PERSON_ID,
          VISIT_ID,
          EVENT_START_DATE,
          EVENT_END_DATE,
          SUBCATEGORY,
          CLINICAL_CAT,
          EVENT_CD,
          EVENT_DESC,
          RESULT_VAL,
          RESULT_UNIT,
          ABORMAL_CD,
          RESULT_NBR,
        } = item;
        if (uniquePersonIllnes["EventTableData"][PERSON_ID]) {
          let visit = uniquePersonIllnes["EventTableData"][PERSON_ID];

          let visitWiseData = {};
          visitWiseData["PERSON_ID"] = PERSON_ID;
          visitWiseData["VISIT_ID"] = VISIT_ID;
          visitWiseData["EVENT_START_DATE"] =
            (EVENT_START_DATE ? EVENT_START_DATE : 0) || 0;
          visitWiseData["EVENT_END_DATE"] =
            (EVENT_END_DATE ? EVENT_END_DATE : 0) || 0;
          visitWiseData["SUBCATEGORY"] =
            (SUBCATEGORY ? SUBCATEGORY : "") || "--";
          visitWiseData["CLINICAL_CAT"] =
            (CLINICAL_CAT ? CLINICAL_CAT : "") || "--";
          visitWiseData["EVENT_CD"] = (EVENT_CD ? EVENT_CD : 0) || 0;
          visitWiseData["EVENT_DESC"] = (EVENT_DESC ? EVENT_DESC : "") || "--'";
          visitWiseData["RESULT_VAL"] = (RESULT_VAL ? RESULT_VAL : "") || "--";
          visitWiseData["RESULT_UNIT"] =
            (RESULT_UNIT ? RESULT_UNIT : "") || "--";
          visitWiseData["ABORMAL_CD"] = (ABORMAL_CD ? ABORMAL_CD : "") || "--";
          // visitWiseData["RESULT_NBR"] = RESULT_NBR ? RESULT_NBR : 0;

          if ((visitTabledata[PERSON_ID] || {})[VISIT_ID]) {
            let { ZIP_TYPE, REASON_FOR_VISIT, VISIT_NUMBER } = (visitTabledata[
              PERSON_ID
            ] || {})[VISIT_ID];

            visitWiseData["VISIT_NUMBER"] = VISIT_NUMBER
              ? VISIT_NUMBER
              : "" || "--";
            visitWiseData["ZIP_TYPE"] = ZIP_TYPE ? ZIP_TYPE : "" || "--";
            visitWiseData["REASON_FOR_VISIT"] = REASON_FOR_VISIT
              ? REASON_FOR_VISIT
              : "" || "--";
          }

          visit.push(visitWiseData);
        }
      });

      // console.log(uniquePersonIllnes);
      //Prepare final result array from uniquePersonIllnes Object.
      for (let PersonID in uniquePersonIllnes["DiagnosesTableData"]) {
        // console.log(uniquePersonIllnes);
        const personDetails =
          uniquePersonIllnes["DiagnosesTableData"][PersonID];
        // console.log(personDetails);
        personDetails.forEach((item) => {
          let result = {
            DIAG_ID: item.DIAG_ID || 0,
            PERSON_ID: Number(item.PERSON_ID) || 0,
            VISIT_ID: Number(item.VISIT_ID) || 0,
            RECORDED_DATE: item.RECORDED_DATE || 0,
            DIAG_DATE: item.DIAG_DATE || 0,
            VALUE: item.VALUE.toString() || "--",
            EVENT_DESC: item.EVENT_DESC || "--",
          };
          preparedResult.DiagnosesTableData.push(Object.values(result));
        });
      }
      for (let PersonID in uniquePersonIllnes["EventTableData"]) {
        // console.log(uniquePersonIllnes);
        const personDetails = uniquePersonIllnes["EventTableData"][PersonID];
        // console.log(personDetails);
        personDetails.forEach((item) => {
          // let result = {
          //   DIAG_ID: item.DIAG_ID || 0,
          //   PERSON_ID: Number(item.PERSON_ID) || 0,
          //   VISIT_ID: Number(item.VISIT_ID) || 0,
          //   RECORDED_DATE: item.RECORDED_DATE || 0,
          //   DIAG_DATE: item.DIAG_DATE || 0,
          //   VALUE: item.VALUE.toString() || "--",
          //   EVENT_DESC: item.EVENT_DESC || "--",
          // };
          preparedResult.EventTableData.push(Object.values(item));
        });
      }
      // console.log("result", preparedResult);
      return preparedResult;
    };
    const createTable = async () => {
      let lastProcessedPersonID = 0,
        offset = 0,
        interval = 5;
      // let lastperson = await sql.query(
      // `select max(PERSON_ID) PERSON_ID from VisitWisePersonDisease`
      // );
      // lastProcessedPersonID = lastperson.recordset[0].PERSON_ID;
      // console.log("personid", lastProcessedPersonID);

      for (let j = 0; j < 6000; j++) {
        // console.log("batches processed-----", j);

        personIDs = await sql.query(
          `select distinct cast(PERSON_ID as bigint) PERSON_ID from visitwisePerson where 
          PERSON_ID in (
          select PERSON_ID VisitCount from visitwisePerson
          group by PERSON_ID
          having count(PERSON_ID)>1
          )
          and
          (Risk_Cat ='Red' or Risk_Factor>1)
          and (age> 32 or RACE = 'African American' or BMI>=35 or (ETHNICITY not like 'Non-Hispanic' and ETHNICITY like 'Hispanic'))
          and (History_of_cardiovascular_disease= 'Yes' or Shortness_of_breath_at_rest = 'Yes' or Severe_orthopnea ='Yes'	or Resting_HR>=110
          or Resting_Systolic_BP>=140 or Oxygen_saturation= '<=94' or Respiratory_rate>=24 or RACE='African American' or 
          Age>32 or Swelling_in_face_or_hands= 'Yes' or Dyspnea= 'Yes' or Tachypnea= 'Yes'
          or New_or_worsening_headache= 'Yes' or Asthma_unresponsive= 'Yes' or Palpitations= 'Yes' 
          or Dizziness_or_syncope= 'Yes' or Chest_pain= 'Yes' or Loud_murmur_heart= 'Yes' 
          or Pre_pregnancy_diagnosis_of_diabetes= 'Yes' or Pre_pregnancy_diagnosis_of_hypertension= 'Yes' or History_of_Substance_use= 'Yes' )
		      order by cast(PERSON_ID as bigint) asc OFFSET ${offset}  ROWS
          FETCH NEXT ${interval} ROWS ONLY`
          // order by cast(PERSON_ID as bigint) asc OFFSET 0  ROWS
          // FETCH NEXT 5 ROWS ONLY
        );
        offset += interval;

        let records = personIDs.recordset;
        // console.log("record", records);
        for (let i = 0; i < records.length; i++) {
          let recordSlice = records[i];
          // console.log(recordSlice);
          let values = await createTableFromPersonID(recordSlice);

          // console.log("values", values);
          let createDiagnosesTable = (data) => {
            // console.log(data);
            const table = new sql.Table("AnalysedDiagnosesTable");
            table.create = true;
            table.columns.add("DIAG_ID", sql.BigInt, { nullable: true });
            table.columns.add("PERSON_ID", sql.BigInt, { nullable: false });
            table.columns.add("VISIT_ID", sql.BigInt, { nullable: false });
            table.columns.add("RECORDED_DATE", sql.BigInt, {
              nullable: true,
            });
            table.columns.add("DIAG_DATE", sql.BigInt, {
              nullable: true,
            });
            table.columns.add("VALUE", sql.VarChar(sql.MAX), {
              nullable: true,
            });
            table.columns.add("EVENT_DESC", sql.VarChar(sql.MAX), {
              nullable: true,
            });

            data.length &&
              data.forEach((value) => {
                // console.log(value);
                table.rows.add(...value);
              });

            const request = new sql.Request();

            data.length &&
              request.bulk(table, (err, result) => {
                // ... error checks
                if (err) {
                  console.log("error in bulk create", err);
                  // res.json({ error: err });
                } else if (result) {
                  // console.log(result);
                }
              });
          };
          let createEventTable = (data) => {
            const table = new sql.Table("AnalysedEventTable");
            table.create = true;
            table.columns.add("PERSON_ID", sql.BigInt, { nullable: false });
            table.columns.add("VISIT_ID", sql.BigInt, { nullable: false });
            table.columns.add("EVENT_START_DATE", sql.BigInt, {
              nullable: true,
            });
            table.columns.add("EVENT_END_DATE", sql.BigInt, {
              nullable: true,
            });
            table.columns.add("SUBCATEGORY", sql.VarChar(sql.MAX), {
              nullable: true,
            });
            table.columns.add("CLINICAL_CAT", sql.VarChar(sql.MAX), {
              nullable: true,
            });
            table.columns.add("EVENT_CD", sql.BigInt, {
              nullable: true,
            });
            table.columns.add("EVENT_DESC", sql.VarChar(sql.MAX), {
              nullable: true,
            });
            table.columns.add("RESULT_VAL", sql.VarChar(sql.MAX), {
              nullable: true,
            });
            table.columns.add("RESULT_UNIT", sql.VarChar(sql.MAX), {
              nullable: true,
            });
            table.columns.add("ABORMAL_CD", sql.VarChar(sql.MAX), {
              nullable: true,
            });
            table.columns.add("VISIT_NUMBER", sql.VarChar(sql.MAX), {
              nullable: true,
            });
            table.columns.add("ZIP_TYPE", sql.VarChar(sql.MAX), {
              nullable: true,
            });
            table.columns.add("REASON_FOR_VISIT", sql.VarChar(sql.MAX), {
              nullable: true,
            });
            // table.columns.add("RESULT_NBR", sql.VarChar(sql.MAX), {
            //   nullable: true,
            // });
            data.length &&
              data.forEach((value) => {
                // console.log(value);
                table.rows.add(...value);
              });
            const request = new sql.Request();
            data.length &&
              request.bulk(table, (err, result) => {
                // ... error checks
                if (err) {
                  console.log("error in bulk create", err);
                  // res.json({ error: err });
                } else if (result) {
                  // console.log(result);
                }
              });
          };
          createDiagnosesTable(values.DiagnosesTableData);
          createEventTable(values.EventTableData);
          // createMedicationAdminTable(values.MedicationAdminTableData);
        }
      }
    };
    createTable();
    //res.json({ data: "Table created in DB" });
  } catch (err) {
    console.log("Error in query ", err);
  }
};
// init();

// catch 404 and forward to error handler
// app.use(function (req, res, next) {
//   var err = new Error("Not Found");
//   err.status = 404;
//   res.json();
// });

// error handlers

// app.set("port", process.env.PORT || 7000);
// const server = app.listen(app.get("port"), "localhost", function () {
//   console.log(" server started with details ", server.address());
//   debug("Express server listening on port " + server.address().port);
// });

module.exports = {
  EventandDiagTable: init,
};
