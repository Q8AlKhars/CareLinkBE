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
      res.status(500).json({ message: error.message });
    }
  },

  // تحديث معلومات الدواء
  update: async (req, res) => {
    try {
      const { loved_one_id, medication_id } = req.params;
      const updates = req.body;
      const caregiverId = req.user.caregiverId;

      // التحقق من الصلاحيات
      const lovedOne = await LovedOne.findOne({
        _id: loved_one_id,
        caregivers: caregiverId,
      });

      if (!lovedOne) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const medication = await Medication.findOneAndUpdate(
        { _id: medication_id, loved_one: loved_one_id },
        updates,
        { new: true }
      );

      if (!medication) {
        return res.status(404).json({ message: "Medication not found" });
      }

      // تسجيل النشاط
      await new ActivityLog({
        description: `Medication updated: ${medication.name}`,
        caregiver: caregiverId,
        action_type: "MEDICATION_UPDATE",
        metadata: new Map([
          ["medication_id", medication_id],
          ["loved_one_id", loved_one_id],
        ]),
      }).save();

      res.json(medication);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // حذف دواء
  delete: async (req, res) => {
    try {
      const { loved_one_id, medication_id } = req.params;
      const caregiverId = req.user.caregiverId;

      // التحقق من الصلاحيات
      const lovedOne = await LovedOne.findOne({
        _id: loved_one_id,
        caregivers: caregiverId,
      });

      if (!lovedOne) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const medication = await Medication.findOneAndDelete({
        _id: medication_id,
        loved_one: loved_one_id,
      });

      if (!medication) {
        return res.status(404).json({ message: "Medication not found" });
      }

      // تسجيل النشاط
      await new ActivityLog({
        description: `Medication deleted: ${medication.name}`,
        caregiver: caregiverId,
        action_type: "MEDICATION_DELETE",
        metadata: new Map([
          ["medication_id", medication_id],
          ["loved_one_id", loved_one_id],
        ]),
      }).save();

      res.json({ message: "Medication deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // جلب أدوية مريض
  getByLovedOne: async (req, res) => {
    try {
      const { loved_one_id } = req.params;
      const { status } = req.query;
      const caregiverId = req.user.caregiverId;

      // التحقق من الصلاحيات
      const lovedOne = await LovedOne.findOne({
        _id: loved_one_id,
        caregivers: caregiverId,
      });

      if (!lovedOne) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const query = { loved_one: loved_one_id };
      if (status) {
        query.status = status;
      }

      const medications = await Medication.find(query)
        .populate("created_by", "name")
        .sort({ start_date: -1 });

      res.json(medications);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // جلب تفاصيل دواء محدد
  getById: async (req, res) => {
    try {
      const { loved_one_id, medication_id } = req.params;
      const caregiverId = req.user.caregiverId;

      // التحقق من الصلاحيات
      const lovedOne = await LovedOne.findOne({
        _id: loved_one_id,
        caregivers: caregiverId,
      });

      if (!lovedOne) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const medication = await Medication.findOne({
        _id: medication_id,
        loved_one: loved_one_id,
      }).populate("created_by", "name");

      if (!medication) {
        return res.status(404).json({ message: "Medication not found" });
      }

      res.json(medication);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // تحديث حالة الدواء
  updateStatus: async (req, res) => {
    try {
      const { loved_one_id, medication_id } = req.params;
      const { status } = req.body;
      const caregiverId = req.user.caregiverId;

      // التحقق من الصلاحيات
      const lovedOne = await LovedOne.findOne({
        _id: loved_one_id,
        caregivers: caregiverId,
      });

      if (!lovedOne) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const medication = await Medication.findOneAndUpdate(
        { _id: medication_id, loved_one: loved_one_id },
        { status },
        { new: true }
      );

      if (!medication) {
        return res.status(404).json({ message: "Medication not found" });
      }

      // تسجيل النشاط
      await new ActivityLog({
        description: `Medication status updated: ${medication.name} - ${status}`,
        caregiver: caregiverId,
        action_type: "MEDICATION_STATUS_UPDATE",
        metadata: new Map([
          ["medication_id", medication_id],
          ["loved_one_id", loved_one_id],
          ["status", status],
        ]),
      }).save();

      res.json(medication);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = medicationController;
