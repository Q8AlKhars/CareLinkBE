const express = require("express");
const router = express.Router();
const caregiverController = require("../controllers/caregiverController");
const upload = require("../middleware/upload");
const auth = require("../middleware/auth");

router.use(auth);

// المسارات الأساسية
router.post("/add-loved-one", auth, caregiverController.addLovedOne);
router.post("/assign-role", auth, caregiverController.assignRole);
router.get("/loved-ones", auth, caregiverController.getLovedOnes);

// مسارات تحديث الصلاحيات
router.put("/:id/permissions", caregiverController.updatePermissions);
router.delete("/:id", caregiverController.removeCaregiver);

router.post(
  "/upload-profile-image",
  upload.single("image"),
  caregiverController.uploadProfileImage
);

// مسارات جديدة للدعوات
router.post("/accept-invitation/:token", caregiverController.acceptInvitation);
router.post("/reject-invitation/:token", caregiverController.rejectInvitation);

module.exports = router;
