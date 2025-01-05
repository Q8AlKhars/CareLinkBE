const express = require("express");
const router = express.Router();
const carePlanController = require("../controllers/carePlanController");
const auth = require("../middleware/auth");

// حماية جميع المسارات باستخدام middleware للتحقق من المصادقة
router.use(auth);

// إنشاء خطة رعاية جديدة
router.post("/loved-one/:loved_one_id", carePlanController.create);

module.exports = router;
