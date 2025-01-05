const mongoose = require("mongoose");

const emergencyAlertSchema = new mongoose.Schema(
  {
    loved_one: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LovedOne",
      required: true,
    },
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Caregiver",
      required: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    },
    type: {
      type: String,
      enum: ["TASK_HELP", "MEDICAL_EMERGENCY", "GENERAL_ASSISTANCE"],
      required: true,
    },
    priority: {
      type: String,
      enum: ["HIGH", "URGENT", "CRITICAL"],
      default: "HIGH",
    },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "RESOLVED", "CANCELLED"],
      default: "PENDING",
    },
    description: {
      type: String,
      required: true,
    },
    location: String,
    response_needed_by: Date,
    responder: {
      caregiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Caregiver",
      },
      response_time: Date,
      notes: String,
    },
    notifications_sent: [
      {
        caregiver: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Caregiver",
        },
        sent_at: Date,
        status: {
          type: String,
          enum: ["SENT", "DELIVERED", "READ"],
          default: "SENT",
        },
      },
    ],
  },
  { timestamps: true }
);

// Indexes للبحث السريع
emergencyAlertSchema.index({ loved_one: 1, status: 1 });
emergencyAlertSchema.index({ requester: 1, status: 1 });
emergencyAlertSchema.index({ "responder.caregiver": 1, status: 1 });

module.exports = mongoose.model("EmergencyAlert", emergencyAlertSchema);
