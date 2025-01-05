const Medication = require("../models/Medication");
const LovedOne = require("../models/LovedOne");
const ActivityLog = require("../models/ActivityLog");

const medicationController = {
  // إنشاء دواء جديد
  create: async (req, res) => {
    try {
      const { loved_one_id } = req.params;
      const {
        name,
        dosage,
        frequency,
        times,
        start_date,
        end_date,
        instructions,
        purpose,
        prescribing_doctor,
        pharmacy,
        side_effects,
        notes,
        status,
      } = req.body;
      const caregiverId = req.user.caregiverId;

      // التحقق من الصلاحيات
      const lovedOne = await LovedOne.findOne({
        _id: loved_one_id,
        caregivers: caregiverId,
      });

      if (!lovedOne) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // طباعة البيانات للتحقق
      console.log("Received data:", {
        frequency,
        start_date,
        times,
      });

      // إنشاء الدواء
      const medication = new Medication({
        loved_one: loved_one_id,
        name,
        dosage,
        frequency,
        times,
        start_date,
        end_date,
        instructions,
        purpose,
        prescribing_doctor,
        pharmacy,
        side_effects,
        notes,
        status,
        created_by: caregiverId,
      });

      // طباعة الكائن قبل الحفظ
      console.log("Medication object:", medication);

      await medication.save();

      // تسجيل النشاط
      await new ActivityLog({
        description: `Medication created: ${name}`,
        caregiver: caregiverId,
        action_type: "MEDICATION_CREATE",
        metadata: new Map([
          ["medication_id", medication._id.toString()],
          ["loved_one_id", loved_one_id],
        ]),
      }).save();

      res.status(201).json(medication);
    } catch (error) {
      console.error("Error details:", error);
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = medicationController;
