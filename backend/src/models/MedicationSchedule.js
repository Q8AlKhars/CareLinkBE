const mongoose = require("mongoose");

const medicationScheduleSchema = new mongoose.Schema(
  {
    medication_name: {
      type: String,
      required: true,
    },
    dosage: {
      type: String,
      required: true,
    },
    schedule_time: {
      type: Date,
      required: true,
    },
    loved_one: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LovedOne",
      required: true,
    },
    assigned_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Caregiver",
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "MISSED"],
      default: "PENDING",
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MedicationSchedule", medicationScheduleSchema);
