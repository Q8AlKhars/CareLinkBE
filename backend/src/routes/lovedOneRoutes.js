const express = require("express");
const router = express.Router();
const lovedOneController = require("../controllers/lovedOneController");
const upload = require("../middleware/upload");
const auth = require("../middleware/auth");

router.use(auth);

// المسارات الأساسية للشخص المحتاج للرعاية
router.get("/:id", lovedOneController.getById);
router.put("/:id", lovedOneController.update);
router.delete("/:id", lovedOneController.delete);

// مسارات السجل الطبي
router.get("/:id/medical-history", lovedOneController.getMedicalHistory);
router.post("/:id/medical-history", lovedOneController.addMedicalHistory);

// مسارات مقدمي الرعاية المرتبطين
router.get("/:id/caregivers", lovedOneController.getCaregivers);
router.post("/:id/caregivers", lovedOneController.addCaregiver);
router.delete(
  "/:id/caregivers/:caregiverId",
  lovedOneController.removeCaregiver
);

// مسارات الصور
router.post(
  "/:loved_one_id/upload-profile-image",
  upload.single("image"),
  lovedOneController.uploadProfileImage
);

router.delete(
  "/:loved_one_id/profile-image",
  lovedOneController.deleteProfileImage
);

module.exports = router;
