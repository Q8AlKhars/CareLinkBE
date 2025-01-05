const mongoose = require("mongoose");

const healthReportSchema = new mongoose.Schema(
  {
    loved_one: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LovedOne",
      required: true,
    },
    generated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Caregiver",
      required: true,
    },
    report_type: {
      type: String,
      enum: ["DAILY", "WEEKLY", "MONTHLY", "CUSTOM"],
      required: true,
    },
    date_range: {
      start: {
        type: Date,
        required: true,
      },
      end: {
        type: Date,
        required: true,
      },
    },
    data: {
      medications: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Medication",
        },
      ],
      appointments: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Appointment",
        },
      ],
      daily_notes: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "DailyNote",
        },
      ],
      tasks: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Task",
        },
      ],
      emergency_alerts: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "EmergencyAlert",
        },
      ],
    },
    summary: {
      medications_adherence: Number, // نسبة الالتزام بالأدوية
      completed_tasks: Number, // عدد المهام المنجزة
      missed_appointments: Number, // عدد المواعيد الفائتة
      emergency_count: Number, // عدد حالات الطوارئ
    },
    notes: String,
    status: {
      type: String,
      enum: ["DRAFT", "GENERATED", "EXPORTED"],
      default: "DRAFT",
    },
    export_format: {
      type: String,
      enum: ["PDF", "EXCEL", "JSON"],
      default: "PDF",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HealthReport", healthReportSchema);
