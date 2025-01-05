const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: String,
    loved_one: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LovedOne",
      required: true,
    },
    assigned_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Caregiver",
      required: true,
    },
    assigned_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Caregiver",
      required: true,
    },
    due_date: Date,
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "MEDIUM",
    },
    status: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
      default: "PENDING",
    },
    category: {
      type: String,
      enum: [
        "MEDICATION",
        "APPOINTMENT",
        "THERAPY",
        "HOUSEHOLD",
        "PERSONAL_CARE",
        "OTHER",
      ],
      required: true,
    },
    recurring: {
      is_recurring: {
        type: Boolean,
        default: false,
      },
      frequency: {
        type: String,
        enum: ["DAILY", "WEEKLY", "MONTHLY"],
      },
      days: [
        {
          type: String,
          enum: [
            "sunday",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
          ],
        },
      ],
    },
    completion_notes: String,
    completed_at: Date,
    care_plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CarePlan",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
