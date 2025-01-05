const MedicationAlert = require("../models/MedicationAlert");
const Medication = require("../models/Medication");

const createMedicationAlerts = async (medication, scheduleTime) => {
  const alertTime = new Date(scheduleTime);
  alertTime.setMinutes(alertTime.getMinutes() - medication.alert_before);

  const alert = new MedicationAlert({
    medication: medication._id,
    scheduled_time: scheduleTime,
    alert_type: "UPCOMING",
    caregiver: medication.alert_settings.notify_caregivers[0],
  });

  await alert.save();
};
