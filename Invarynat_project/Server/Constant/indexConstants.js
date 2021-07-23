const DiagnosesPointers = {
  "O99.419": {
    pointerkey: "History_of_cardiovascular_disease",
    pointerValue: "Yes",
    riskCategory: "RED",
  },
  "R60.9": {
    pointerkey: "Swelling_in_face_or_hands",
    pointerValue: "Yes",
    riskFactor: {
      Symptoms: 1,
    },
  },
  "R06.02": {
    pointerkey: "Shortness_of_breath_at_rest",
    pointerValue: "Yes",
    riskCategory: "RED",
    // riskFactor: {
    //   Symptoms: 1,
    // },
    // Not sure need to confirm
    // visit["Risk_Factor"]["Symptoms"] += 1;
  },
  "R06.00": {
    pointerkey: "Dyspnea",
    pointerValue: "Yes",
    riskFactor: {
      Symptoms: 1,
    },
  },
  "R06.82": {
    pointerkey: "Tachypnea",
    pointerValue: "Yes",
    riskFactor: {
      Symptoms: 1,
    },
  },
  "R51": {
    pointerkey: "New_or_worsening_headache",
    pointerValue: "Yes",
    riskFactor: {
      Symptoms: 1,
    },
    // Not sure need to confirm
    //visit["Risk_Factor"]["Symptoms"] += 1;
  },
  "J45": {
    pointerkey: "Asthma_unresponsive",
    pointerValue: "Yes",
    riskFactor: {
      Symptoms: 1,
    },
  },
  "R07.9": {
    pointerkey: "Chest_pain",
    pointerValue: "Yes",
    riskFactor: {
      Symptoms: 1,
    },
  },
  "R42": {
    pointerkey: "Dizziness_or_syncope",
    pointerValue: "Yes",
    riskFactor: {
      Symptoms: 1,
    },
  },
  "R55": {
    pointerkey: "Dizziness_or_syncope",
    pointerValue: "Yes",
    riskFactor: {
      Symptoms: 1,
    },
  },
  "R00.2": {
    pointerkey: "Palpitations",
    pointerValue: "Yes",
    riskFactor: {
      Symptoms: 1,
    },
  },
  "R01.1": {
    pointerkey: "Loud_murmur_heart",
    pointerValue: "Yes",
    riskFactor: {
      Physical_exam: 1,
    },
  },
  "R09.02": {
    pointerkey: "Oxygen_saturation",
    pointerValue: "<=94",
    riskCategory: "RED",
  },
};

module.exports = {
  DiagnosesPointers,
};
