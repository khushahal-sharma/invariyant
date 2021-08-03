var sql = require("mssql");
var dbConfig = require("./Database/dbConnection");

const { DiagnosesPointers } = require("./Constant/indexConstants");

const init = async () => {
  try {
    await sql.connect(dbConfig.dbConnection());
    let result = {};

    let offset = 0,
      interval = 5;

    const createTableFromPersonID = async ({ PERSON_ID, VISIT_id }) => {
      let personIdValues = "",
        visitIdValues = "",
        preparedResult = [],
        uniquePersonIllnes = {};
      // find unique persion id.
      uniquePersonIllnes[PERSON_ID] = {
        VISIT_id,
        PERSON_ID,
        VISITS: {},
      };

      // Creating person values;
      personIdValues += personIdValues.length
        ? `,${PERSON_ID}`
        : `${PERSON_ID}`;

      visitIdValues += visitIdValues.length ? `,${VISIT_id}` : `${VISIT_id}`;

      let MedicationResult = {};

      MedicationResult = await sql.query(
        `SELECT * FROM MedicationOrders Where PERSON_ID IN (${personIdValues}) and VISIT_ID IN (${visitIdValues}) `
      );

      // console.log(MedicationResult);

      (MedicationResult.recordset || []).forEach((item) => {
        const {
          VISIT_ID,
          PERSON_ID,
          MedicationDSC,
          StrengthDoseAMT,
          StrengthDoseCD,
        } = item;

        if (uniquePersonIllnes[PERSON_ID]) {
          !uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID] &&
            (uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID] = {});

          let visit = uniquePersonIllnes[PERSON_ID]["VISITS"][VISIT_ID];
          visit["MedicationDSC"] = MedicationDSC;
          visit["StrengthDoseAMT"] = StrengthDoseAMT;
          visit["StrengthDoseCD"] = StrengthDoseCD;
        }
      });
      // console.log(uniquePersonIllnes);

      //Prepare final result array from uniquePersonIllnes Object.
      for (let PersonID in uniquePersonIllnes) {
        const personDetails = uniquePersonIllnes[PersonID];
        // console.log(personDetails);
        for (let visitId in personDetails["VISITS"]) {
          const visitDetail = personDetails["VISITS"][visitId];
          const result = {
            VISIT_ID: Number(visitId),
            PERSON_ID: Number(personDetails.PERSON_ID),
            MedicationDSC: visitDetail.MedicationDSC,
            StrengthDoseAMT: visitDetail.StrengthDoseAMT,
            StrengthDoseCD: visitDetail.StrengthDoseCD,
          };

          preparedResult.push(Object.values(result));
        }
      }
      // console.log("result", preparedResult);
      return preparedResult;
    };
    const loopFunction = async () => {
      let lastProcessedPersonID = 0;
      // let lastperson = await sql.query(
      // `select max(person_id) person_id from VisitWisePersonDisease`
      // );
      // lastProcessedPersonID = lastperson.recordset[0].person_id;
      // console.log("personid", lastProcessedPersonID);
      for (let j = 0; j < 3; j++) {
        // console.log("batches processed-----", j);
        result = await sql.query(
          `select PERSON_ID,VISIT_id from VisitWisePersonDisease 
            where  cast(person_id as bigint) >${lastProcessedPersonID || 0} 
            order by cast(person_id as bigint) asc OFFSET ${offset}  ROWS
          FETCH NEXT ${interval} ROWS ONLY`
        );
        offset += interval;

        let record = result.recordset;
        // console.log("record", record);
        for (let i = 0; i < record.length; i++) {
          let recordSlice = record[i],
            values = await createTableFromPersonID(recordSlice);

          // console.log("values", values);

          const table = new sql.Table("VisitWisePersonWithMedications");
          table.create = true;
          table.columns.add("VISIT_ID", sql.SmallInt, { nullable: true });
          table.columns.add("PERSON_ID", sql.SmallInt, { nullable: true });
          table.columns.add("MedicationDSC", sql.VarChar(sql.MAX), {
            nullable: true,
          });
          table.columns.add("StrengthDoseAMT", sql.BigInt, { nullable: true });
          table.columns.add("StrengthDoseCD", sql.VarChar(sql.MAX), {
            nullable: true,
          });

          values.length &&
            values.forEach((value) => {
              // console.log(value);
              table.rows.add(...value);
            });
          // console.log(table);
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
    loopFunction();
    //res.json({ data: "Table created in DB" });
  } catch (err) {
    console.log("Error in query ", err);
  }
};
init();
