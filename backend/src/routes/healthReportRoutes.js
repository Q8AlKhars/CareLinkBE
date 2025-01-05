const express = require("express");
const router = express.Router();
const healthReportController = require("../controllers/healthReportController");
const auth = require("../middleware/auth");

router.use(auth);

router.post("/generate", healthReportController.generateReport);
router.get("/export/:report_id/:format", healthReportController.exportReport);

module.exports = router;
