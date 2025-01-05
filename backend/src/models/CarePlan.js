const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  target_date: Date,
  status: {
    type: String,
    enum: ["PENDING", "IN_PROGRESS", "COMPLETED"],
    default: "PENDING",
  },
});

const carePlanSchema = new mongoose.Schema(
  {
    loved_one: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LovedOne",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: String,
    goals: [goalSchema],
    schedule: {
      start_date: {
        type: Date,
        required: true,
      },
      end_date: Date,
    },
    status: {
      type: String,
      enum: ["DRAFT", "ACTIVE", "COMPLETED", "ARCHIVED"],
      default: "DRAFT",
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Caregiver",
      required: true,
    },
    notes: String,
  },
  { timestamps: true }
);

carePlanSchema.index({ loved_one: 1, status: 1 });
carePlanSchema.index({ created_by: 1, status: 1 });

module.exports = mongoose.model("CarePlan", carePlanSchema);
