const express = require("express");
const router = express.Router();
const medicationController = require("../controllers/medicationController");
const auth = require("../middleware/auth");

router.use(auth);

// إنشاء دواء جديد
router.post("/loved-one/:loved_one_id", medicationController.create);

// تحديث معلومات الدواء
router.put(
  "/loved-one/:loved_one_id/:medication_id",
  medicationController.update
);

// حذف دواء
router.delete(
  "/loved-one/:loved_one_id/:medication_id",
  medicationController.delete
);

// الحصول على قائمة الأدوية لشخص محبوب
router.get("/loved-one/:loved_one_id", medicationController.getByLovedOne);

// الحصول على تفاصيل دواء محدد
router.get(
  "/loved-one/:loved_one_id/:medication_id",
  medicationController.getById
);

// تحديث حالة الدواء (نشط/غير نشط)
router.patch(
  "/loved-one/:loved_one_id/:medication_id/status",
  medicationController.updateStatus
);

module.exports = router;
