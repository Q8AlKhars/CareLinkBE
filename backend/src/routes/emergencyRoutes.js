const express = require("express");
const router = express.Router();
const emergencyAlertController = require("../controllers/emergencyAlertController");
const auth = require("../middleware/auth");

router.use(auth);

router.post("/", emergencyAlertController.create);
router.put("/:id/resolve", emergencyAlertController.resolve);
router.get("/active/:loved_one_id", emergencyAlertController.getActive);

module.exports = router;
