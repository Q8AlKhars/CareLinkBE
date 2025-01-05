const express = require("express");
const router = express.Router();
const calendarController = require("../controllers/calendarController");
const auth = require("../middleware/auth");

router.use(auth);

router.post("/settings", calendarController.syncSettings);
router.post("/sync", calendarController.syncCalendar);
router.get("/events", calendarController.getUpcomingEvents);
router.get("/download/:loved_one_id", calendarController.generateCalendar);

module.exports = router;
