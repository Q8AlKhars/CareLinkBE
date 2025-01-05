const mongoose = require("mongoose");

const medicationLogSchema = new mongoose.Schema(
  {
    medication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medication",
      required: true,
    },
    taken_at: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["TAKEN", "MISSED", "SKIPPED"],
      required: true,
    },
    recorded_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Caregiver",
      required: true,
    },
    notes: String,
    dosage_taken: {
      amount: Number,
      unit: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MedicationLog", medicationLogSchema);
