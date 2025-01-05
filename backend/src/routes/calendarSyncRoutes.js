const express = require("express");
const router = express.Router();
const calendarSyncController = require("../controllers/calendarSyncController");
const auth = require("../middleware/auth");

// حماية جميع المسارات باستخدام middleware للتحقق من المصادقة
router.use(auth);

// الحصول على رابط المصادقة
router.get("/google/auth-url", calendarSyncController.getAuthUrl);

// معالجة callback من Google
router.get("/google/callback", calendarSyncController.handleCallback);

// تحديث إعدادات المزامنة
router.patch("/settings", calendarSyncController.updateSyncSettings);

// مزامنة المواعيد
router.post(
  "/appointments/sync/:loved_one_id",
  calendarSyncController.syncAppointments
);

module.exports = router;
