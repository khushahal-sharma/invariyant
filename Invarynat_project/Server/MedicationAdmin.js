var sql = require("mssql");
var dbConfig = require("./Database/dbConnection");

const init = async () => {
  try {
    await sql.connect(dbConfig.dbConnection());
    let personIDs = {};

    const createTableFromPersonID = async ({ PERSON_ID }) => {
      let personIdValues = "",
        preparedResult = {
          MedicationAdminTableData: [],
        },
        uniquePersonIllnes = {
          MedicationAdminTableData: {},
        };

      // find unique persion id.
      uniquePersonIllnes["MedicationAdminTableData"][PERSON_ID] = [];

      // Creating person values;
      personIdValues += personIdValues.length
        ? `,${PERSON_ID}`
        : `${PERSON_ID}`;
      // });

      let MedicationAdminResult = {};

      MedicationAdminResult = await sql.query(
        `SELECT * FROM MedicationAdministration Where PERSON_ID IN (${personIdValues})
        and RXNormDSC not in (
          'diphenhydramine',
          'ondansetron',
          'witch hazel',
          'propofol',
          'fentanyl',
          'acetaminophen',
          'keterolac',
          'docusate',
          'morphine',
          'ibuprofen',
          'influenza virus vaccine'
          )
          and  RXNormDSC  not like '%caine%'`
      );

      (MedicationAdminResult.recordset || []).forEach((item) => {
        let {
          PERSON_ID,
          VISIT_ID,
          AdministrationDate,
          RXNormDSC,
          RouteDSC,
          DoseAMT,
          DoseUnitCD,
        } = item;
        if (uniquePersonIllnes["MedicationAdminTableData"][PERSON_ID]) {
          let visit = uniquePersonIllnes["MedicationAdminTableData"][PERSON_ID];

          let visitWiseData = {};
          visitWiseData["PERSON_ID"] = (PERSON_ID ? PERSON_ID : 0) || 0;
          visitWiseData["VISIT_ID"] = (VISIT_ID ? VISIT_ID : 0) || 0;
          visitWiseData["AdministrationDate"] =
            (AdministrationDate ? AdministrationDate : 0) || 0;
          visitWiseData["RXNormDSC"] = (RXNormDSC ? RXNormDSC : "") || "--";
          visitWiseData["RouteDSC"] = (RouteDSC ? RouteDSC : "") || "--";
          visitWiseData["DoseAMT"] = (DoseAMT ? DoseAMT : 0) || 0;
          visitWiseData["DoseUnitCD"] = (DoseUnitCD ? DoseUnitCD : "") || "--";

          visit.push(visitWiseData);
        }
      });

      for (let PersonID in uniquePersonIllnes["MedicationAdminTableData"]) {
        const personDetails =
          uniquePersonIllnes["MedicationAdminTableData"][PersonID];

        personDetails.forEach((item) => {
          preparedResult.MedicationAdminTableData.push(Object.values(item));
        });
      }
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
          `select distinct cast(PERSON_ID as bigint) PERSON_ID from VisitWisePerson where 
          PERSON_ID in (
          select PERSON_ID VisitCount from visitwisePerson
          group by PERSON_ID
          having count(PERSON_ID)>1
          )
          and
          (Risk_Cat ='Red' or Risk_Factor>1)
          and (age>=40 or RACE = 'African American' or BMI>=35 or (ETHNICITY not like 'Non-Hispanic' and ETHNICITY like 'Hispanic'))
          and (History_of_cardiovascular_disease= 'Yes' or Shortness_of_breath_at_rest = 'Yes' or Severe_orthopnea ='Yes'	or Resting_HR>=110
          or Resting_Systolic_BP>=140 or Oxygen_saturation= '<=94' or Respiratory_rate>=24 or Swelling_in_face_or_hands= 'Yes' or Dyspnea= 'Yes' or Tachypnea= 'Yes'
          or New_or_worsening_headache= 'Yes' or Asthma_unresponsive= 'Yes' or Palpitations= 'Yes' 
          or Dizziness_or_syncope= 'Yes' or Chest_pain= 'Yes' or Loud_murmur_heart= 'Yes' 
          or Pre_pregnancy_diagnosis_of_diabetes= 'Yes' or Pre_pregnancy_diagnosis_of_hypertension= 'Yes' or History_of_Substance_use= 'Yes' )
		      order by cast(PERSON_ID as bigint) asc OFFSET ${offset}  ROWS
          FETCH NEXT ${interval} ROWS ONLY`
        );
        offset += interval;

        let records = personIDs.recordset;
        for (let i = 0; i < records.length; i++) {
          let recordSlice = records[i];
          let values = await createTableFromPersonID(recordSlice);

          let createMedicationAdminTable = (data) => {
            const table = new sql.Table("AnalysedMedicationAdminTable");
            table.create = true;
            table.columns.add("PERSON_ID", sql.BigInt, { nullable: false });
            table.columns.add("VISIT_ID", sql.BigInt, { nullable: false });
            table.columns.add("AdministrationDate", sql.BigInt, {
              nullable: true,
            });
            table.columns.add("RXNormDSC", sql.VarChar(sql.MAX), {
              nullable: true,
            });
            table.columns.add("RouteDSC", sql.VarChar(sql.MAX), {
              nullable: true,
            });
            table.columns.add("DoseAMT", sql.Float, {
              nullable: true,
            });
            table.columns.add("DoseUnitCD", sql.VarChar(sql.MAX), {
              nullable: true,
            });

            data.length &&
              data.forEach((value) => {
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

          createMedicationAdminTable(values.MedicationAdminTableData);
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

module.exports = {
  Medication: init,
};
