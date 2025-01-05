const express = require("express");
const router = express.Router();
const medicalHistoryController = require("../controllers/medicalHistoryController");
const auth = require("../middleware/auth");

router.use(auth);

router.post(
  "/loved-one/:loved_one_id",
  medicalHistoryController.createOrUpdate
);
router.get("/loved-one/:loved_one_id", medicalHistoryController.getByLovedOne);

router.post(
  "/loved-one/:loved_one_id/conditions",
  medicalHistoryController.addCondition
);
router.post(
  "/loved-one/:loved_one_id/medications",
  medicalHistoryController.addMedication
);
router.post(
  "/loved-one/:loved_one_id/documents",
  medicalHistoryController.addDocument
);

router.patch(
  "/loved-one/:loved_one_id/conditions/:condition_id",
  medicalHistoryController.updateCondition
);
router.delete(
  "/loved-one/:loved_one_id/conditions/:condition_id",
  medicalHistoryController.deleteCondition
);
router.get("/loved-one/:loved_one_id/search", medicalHistoryController.search);
router.get(
  "/loved-one/:loved_one_id/export",
  medicalHistoryController.exportReport
);

module.exports = router;
