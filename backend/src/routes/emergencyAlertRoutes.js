const express = require("express");
const router = express.Router();
const emergencyAlertController = require("../controllers/emergencyAlertController");
const auth = require("../middleware/auth");

// حماية جميع المسارات باستخدام middleware للتحقق من المصادقة
router.use(auth);

// إنشاء تنبيه طوارئ
router.post("/loved-one/:loved_one_id", emergencyAlertController.create);

// الاستجابة لتنبيه طوارئ
router.patch("/:alert_id/respond", emergencyAlertController.respond);

// جلب تنبيهات شخص محتاج للرعاية
router.get("/loved-one/:loved_one_id", emergencyAlertController.getByLovedOne);

// تحديث حالة الإشعار
router.patch(
  "/:alert_id/notification-status",
  emergencyAlertController.updateNotificationStatus
);

module.exports = router;
