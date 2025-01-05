const express = require("express");
const router = express.Router();
const dailyNoteController = require("../controllers/dailyNoteController");
const auth = require("../middleware/auth");

router.use(auth);

router.post("/", dailyNoteController.create);

module.exports = router;
