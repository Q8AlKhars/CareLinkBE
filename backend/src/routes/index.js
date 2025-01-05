const express = require("express");
const router = express.Router();

// استيراد جميع المسارات
const authRoutes = require("./authRoutes");
const caregiverRoutes = require("./caregiverRoutes");
const lovedOneRoutes = require("./lovedOneRoutes");
const carePlanRoutes = require("./carePlanRoutes");
const taskRoutes = require("./taskRoutes");
const medicationRoutes = require("./medicationRoutes");
const dailyNoteRoutes = require("./dailyNoteRoutes");
const medicalHistoryRoutes = require("./medicalHistoryRoutes");
const emergencyAlertRoutes = require("./emergencyAlertRoutes");
const appointmentRoutes = require("./appointmentRoutes");
const notificationRoutes = require("./notificationRoutes");
const calendarSyncRoutes = require("./calendarSyncRoutes");
const calendarRoutes = require("./calendarRoutes");
const healthReportRoutes = require("./healthReportRoutes");
const caregiverRoleRoutes = require("./caregiverRoleRoutes");

// تعيين المسارات الرئيسية
router.use("/auth", authRoutes);
router.use("/caregivers", caregiverRoutes);
router.use("/loved-ones", lovedOneRoutes);
router.use("/care-plans", carePlanRoutes);
router.use("/tasks", taskRoutes);
router.use("/medications", medicationRoutes);
router.use("/daily-notes", dailyNoteRoutes);
router.use("/medical-history", medicalHistoryRoutes);
router.use("/emergency-alerts", emergencyAlertRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/notifications", notificationRoutes);
router.use("/calendar-sync", calendarSyncRoutes);
router.use("/calendar", calendarRoutes);
router.use("/health-reports", healthReportRoutes);
router.use("/caregiver-roles", caregiverRoleRoutes);

// التعامل مع المسارات غير الموجودة
router.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

module.exports = router;
