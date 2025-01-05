const express = require("express");
const router = express.Router();
const caregiverRoleController = require("../controllers/caregiverRoleController");
const auth = require("../middleware/auth");

router.use(auth);

// عرض جميع الأدوار
router.get("/roles", caregiverRoleController.getRoles);

// تغيير دور مقدم الرعاية
router.post("/change-role", caregiverRoleController.changeRole);

// التحقق من دور مقدم الرعاية
router.get("/check-role/:loved_one_id", caregiverRoleController.checkRole);

module.exports = router;
