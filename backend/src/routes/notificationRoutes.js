const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const auth = require("../middleware/auth");

router.use(auth);

router.post("/", notificationController.create);
router.patch("/:notification_id/status", notificationController.updateStatus);
router.get("/my", notificationController.getByCaregiver);
router.post(
  "/medication-reminder",
  notificationController.createMedicationReminder
);
router.post(
  "/care-plan-update",
  notificationController.createCarePlanUpdateNotification
);

module.exports = router;
