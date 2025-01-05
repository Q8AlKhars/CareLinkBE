const mongoose = require("mongoose");

const medicationAlertSchema = new mongoose.Schema(
  {
    medication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medication",
      required: true,
    },
    scheduled_time: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "SENT", "ACKNOWLEDGED"],
      default: "PENDING",
    },
    alert_type: {
      type: String,
      enum: ["UPCOMING", "OVERDUE", "MISSED"],
      required: true,
    },
    caregiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Caregiver",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MedicationAlert", medicationAlertSchema);
