const express = require("express");
const router = express.Router();
const medicationController = require("../controllers/medicationController");
const auth = require("../middleware/auth");

router.use(auth);

router.post("/loved-one/:loved_one_id", medicationController.create);

module.exports = router;
