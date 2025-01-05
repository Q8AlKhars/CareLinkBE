const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const auth = require("../middleware/auth");

router.use(auth);

router.post("/", taskController.create);
router.get("/assigned", taskController.getAssignedTasks);
router.patch("/:id/status", taskController.updateStatus);
router.get("/loved-one/:id", taskController.getLovedOneTasks);

module.exports = router;
