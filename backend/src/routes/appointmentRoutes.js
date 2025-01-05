const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointmentController");
const auth = require("../middleware/auth");

// حماية جميع المسارات باستخدام middleware للتحقق من المصادقة
router.use(auth);

// إنشاء موعد جديد
router.post("/loved-one/:loved_one_id", appointmentController.create);

// تحديث موعد
router.patch("/:appointment_id", appointmentController.update);

// حذف موعد
router.delete("/:appointment_id", appointmentController.delete);

// جلب مواعيد شخص محتاج للرعاية
router.get("/loved-one/:loved_one_id", appointmentController.getByLovedOne);

module.exports = router;
