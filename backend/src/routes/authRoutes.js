const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const auth = require("../middleware/auth");

router.post("/register", authController.register);
router.post(
  "/verify-registration",
  authController.verifyAndCompleteRegistration
);
router.post("/login", authController.login);
router.post("/logout", auth, authController.logout);
router.get("/verify", auth, authController.verifyToken);
router.post("/verify-2fa", authController.verify2FA);
router.post("/change-password", auth, authController.changePassword);

module.exports = router;
