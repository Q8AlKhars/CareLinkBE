const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ["MEDICAL", "THERAPY", "SOCIAL", "OTHER"],
      required: true,
    },
    start_time: {
      type: Date,
      required: true,
    },
    end_time: {
      type: Date,
      required: true,
    },
    location: String,
    description: String,
    attendees: [
      {
        caregiver: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Caregiver",
        },
        status: {
          type: String,
          enum: ["PENDING", "ACCEPTED", "DECLINED"],
          default: "PENDING",
        },
      },
    ],
    reminders: [
      {
        time: Date,
        sent: {
          type: Boolean,
          default: false,
        },
      },
    ],
    recurring: {
      type: Boolean,
      default: false,
    },
    recurring_pattern: {
      frequency: {
        type: String,
        enum: ["DAILY", "WEEKLY", "MONTHLY"],
      },
      interval: Number,
      end_date: Date,
    },
    status: {
      type: String,
      enum: ["SCHEDULED", "COMPLETED", "CANCELLED", "RESCHEDULED"],
      default: "SCHEDULED",
    },
    notes: String,
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Caregiver",
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes للبحث السريع
appointmentSchema.index({ loved_one: 1, start_time: 1 });
appointmentSchema.index({ "attendees.caregiver": 1, start_time: 1 });
appointmentSchema.index({ status: 1, start_time: 1 });

module.exports = mongoose.model("Appointment", appointmentSchema);
