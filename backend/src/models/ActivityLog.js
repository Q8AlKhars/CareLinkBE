const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
    },
    caregiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Caregiver",
      required: true,
    },
    care_plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CarePlan",
    },
    action_type: {
      type: String,
      enum: [
        "LOGIN",
        "LOGOUT",
        "TASK_CREATE",
        "TASK_UPDATE",
        "TASK_DELETE",
        "CARE_PLAN_CREATE",
        "CARE_PLAN_UPDATE",
        "CARE_PLAN_DELETE",
        "MEDICATION_CREATE",
        "MEDICATION_UPDATE",
        "MEDICATION_DELETE",
        "DAILY_NOTE_CREATE",
        "DAILY_NOTE_UPDATE",
        "DAILY_NOTE_DELETE",
        "MEDICAL_HISTORY_UPDATE",
        "EMERGENCY_ALERT",
        "APPOINTMENT_CREATE",
        "APPOINTMENT_UPDATE",
        "APPOINTMENT_DELETE",
        "NOTIFICATION_CREATE",
        "NOTIFICATION_UPDATE",
        "CALENDAR_SYNC_CONNECT",
        "CALENDAR_SYNC_UPDATE",
        "HEALTH_REPORT_GENERATE",
        "HEALTH_REPORT_EXPORT",
      ],
      required: true,
    },
    metadata: {
      type: Map,
      of: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ActivityLog", activityLogSchema);
