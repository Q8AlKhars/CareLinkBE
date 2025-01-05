const mongoose = require("mongoose");

const medicalConditionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  diagnosis_date: Date,
  status: {
    type: String,
    enum: ["ACTIVE", "MANAGED", "RESOLVED"],
    default: "ACTIVE",
  },
  severity: {
    type: String,
    enum: ["MILD", "MODERATE", "SEVERE"],
  },
  notes: String,
});

const medicationHistorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  dosage: String,
  start_date: Date,
  end_date: Date,
  reason: String,
  side_effects: [String],
  effectiveness: {
    type: String,
    enum: ["EFFECTIVE", "PARTIALLY_EFFECTIVE", "NOT_EFFECTIVE"],
  },
});

const medicalHistorySchema = new mongoose.Schema(
  {
    loved_one: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LovedOne",
      required: true,
    },
    conditions: [medicalConditionSchema],
    medications: [medicationHistorySchema],
    allergies: [
      {
        allergen: String,
        reaction: String,
        severity: {
          type: String,
          enum: ["MILD", "MODERATE", "SEVERE"],
        },
        diagnosis_date: Date,
      },
    ],
    surgeries: [
      {
        procedure: String,
        date: Date,
        hospital: String,
        surgeon: String,
        outcome: String,
        notes: String,
      },
    ],
    immunizations: [
      {
        vaccine: String,
        date: Date,
        due_date: Date,
        provider: String,
        notes: String,
      },
    ],
    family_history: [
      {
        condition: String,
        relationship: String,
        notes: String,
      },
    ],
    documents: [
      {
        title: String,
        type: {
          type: String,
          enum: [
            "LAB_RESULT",
            "PRESCRIPTION",
            "DISCHARGE_SUMMARY",
            "IMAGING",
            "OTHER",
          ],
        },
        file_url: String,
        date: Date,
        notes: String,
      },
    ],
    notes: String,
    last_updated: {
      date: Date,
      by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Caregiver",
      },
    },
  },
  { timestamps: true }
);

// Indexes للبحث السريع
medicalHistorySchema.index({ loved_one: 1 });
medicalHistorySchema.index({ "conditions.name": 1 });
medicalHistorySchema.index({ "medications.name": 1 });

module.exports = mongoose.model("MedicalHistory", medicalHistorySchema);
