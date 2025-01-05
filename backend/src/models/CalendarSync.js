const mongoose = require("mongoose");

const calendarSyncSchema = new mongoose.Schema(
  {
    caregiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Caregiver",
      required: true,
    },
    calendar_type: {
      type: String,
      enum: ["PHONE", "GOOGLE", "OUTLOOK"],
      default: "PHONE",
    },
    sync_direction: {
      type: String,
      enum: ["ONE_WAY", "TWO_WAY"],
      default: "ONE_WAY",
    },
    external_calendar_id: String,
    sync_preferences: {
      appointments: {
        type: Boolean,
        default: true,
      },
      medications: {
        type: Boolean,
        default: true,
      },
      tasks: {
        type: Boolean,
        default: false,
      },
    },
    last_sync: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("CalendarSync", calendarSyncSchema);
