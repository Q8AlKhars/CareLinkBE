const mongoose = require("mongoose");

const dailyNoteSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    loved_one: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LovedOne",
      required: true,
    },
    care_plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CarePlan",
    },
    caregiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Caregiver",
      required: true,
    },
    type: {
      type: String,
      enum: ["GENERAL", "PROGRESS_NOTE", "MEDICATION_NOTE", "THERAPY_NOTE"],
      default: "GENERAL",
    },
    tags: [String],
    attachments: [
      {
        url: String,
        type: String, // "image", "document", etc.
        name: String,
      },
    ],
    mood: {
      type: String,
      enum: ["EXCELLENT", "GOOD", "FAIR", "POOR"],
    },
    metrics: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DailyNote", dailyNoteSchema);
