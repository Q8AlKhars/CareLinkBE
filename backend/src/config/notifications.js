const config = {
  // إعدادات الإشعارات
  pushNotifications: {
    enabled: true,
    provider: "firebase", // يمكن تغييره حسب مزود خدمة الإشعارات
  },

  // إعدادات البريد الإلكتروني
  email: {
    enabled: true,
    from: process.env.EMAIL_FROM,
    templates: {
      taskAssignment: "task-assignment",
      emergencyAlert: "emergency-alert",
      medicationReminder: "medication-reminder",
    },
  },

  // إعدادات الرسائل النصية
  sms: {
    enabled: true,
    provider: "twilio", // يمكن تغييره حسب مزود خدمة الرسائل
  },
};

module.exports = config;
