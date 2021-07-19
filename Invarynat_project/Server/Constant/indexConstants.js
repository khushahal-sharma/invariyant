const DiagnosesPointers = {
  "O99.419": {
    pointerkey: "History_of_cardiovascular_disease",
    pointerValue: "Yes",
    riskCategory: "RED",
  },
  "R60.9": {
    pointerkey: "Swelling_in_face_or_hands",
    pointerValue: "Yes",
  },
  "R06.02": {
    pointerkey: "Shortness_of_breath_at_rest",
    pointerValue: "Yes",
    riskCategory: "RED",
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
  R51: {
    pointerkey: "New_or_worsening_headache",
    pointerValue: "Yes",
    // Not sure need to confirm
    //visit["Risk_Factor"]["Symptoms"] += 1;
  },
};

module.exports = {
  DiagnosesPointers,
};
