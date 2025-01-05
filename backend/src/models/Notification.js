const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Caregiver",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "MEDICATION_REMINDER",
        "CARE_PLAN_UPDATE",
        "TASK_ASSIGNMENT",
        "TASK_REMINDER",
        "EMERGENCY_ALERT",
        "APPOINTMENT_REMINDER",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    reference: {
      // المرجع (مثل: الدواء، خطة الرعاية، المهمة)
      type: mongoose.Schema.Types.ObjectId,
      refPath: "referenceModel",
    },
    referenceModel: {
      // نوع المرجع
      type: String,
      enum: ["Medication", "CarePlan", "Task", "EmergencyAlert", "Appointment"],
    },
    status: {
      type: String,
      enum: ["UNREAD", "READ", "DISMISSED"],
      default: "UNREAD",
    },
    scheduled_for: Date, // للتذكيرات المجدولة
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM",
    },
    metadata: {
      type: Map,
      of: String,
    },
  },
  { timestamps: true }
);

// Indexes للبحث السريع
notificationSchema.index({ recipient: 1, status: 1 });
notificationSchema.index({ scheduled_for: 1, status: 1 });
notificationSchema.index({ type: 1, status: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
