const mongoose = require("mongoose");

const medicationSchema = new mongoose.Schema(
  {
    loved_one: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LovedOne",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    dosage: {
      type: String,
      required: true,
    },
    frequency: {
      type: String,
      enum: ["DAILY", "WEEKLY", "MONTHLY", "AS_NEEDED"],
      required: true,
    },
    times: [String], // ["08:00", "20:00"]
    start_date: {
      type: Date,
      required: true,
      set: (v) => new Date(v),
    },
    end_date: {
      type: Date,
      set: (v) => (v ? new Date(v) : undefined),
    },
    instructions: String,
    purpose: String,
    prescribing_doctor: String,
    pharmacy: String,
    side_effects: [String],
    notes: String,
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Caregiver",
      required: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "DISCONTINUED", "COMPLETED"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

// Indexes للبحث السريع
medicationSchema.index({ loved_one: 1, status: 1 });
medicationSchema.index({ created_by: 1, status: 1 });

module.exports = mongoose.model("Medication", medicationSchema);
