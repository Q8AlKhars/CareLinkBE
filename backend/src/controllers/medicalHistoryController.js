const MedicalHistory = require("../models/MedicalHistory");
const LovedOne = require("../models/LovedOne");
const ActivityLog = require("../models/ActivityLog");

const medicalHistoryController = {
  // إنشاء أو تحديث التاريخ الطبي
  createOrUpdate: async (req, res) => {
    try {
      const { loved_one_id } = req.params;
      const caregiverId = req.user.caregiverId;

      // التحقق من الصلاحيات
      const lovedOne = await LovedOne.findOne({
        _id: loved_one_id,
        caregivers: caregiverId,
      });

      if (!lovedOne) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // البحث عن سجل موجود أو إنشاء سجل جديد
      let medicalHistory = await MedicalHistory.findOne({
        loved_one: loved_one_id,
      });

      if (!medicalHistory) {
        medicalHistory = new MedicalHistory({
          loved_one: loved_one_id,
        });
      }

      // تحديث البيانات
      const updateData = { ...req.body };
      delete updateData.loved_one; // منع تغيير الشخص المحتاج للرعاية

      // تحديث معلومات آخر تعديل
      updateData.last_updated = {
        date: new Date(),
        by: caregiverId,
      };

      Object.assign(medicalHistory, updateData);
      await medicalHistory.save();

      // تسجيل النشاط
      await new ActivityLog({
        description: "Medical history updated",
        caregiver: caregiverId,
        action_type: "MEDICAL_HISTORY_UPDATE",
        metadata: new Map([["loved_one_id", loved_one_id]]),
      }).save();

      res.json(medicalHistory);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // جلب التاريخ الطبي
  getByLovedOne: async (req, res) => {
    try {
      const { loved_one_id } = req.params;
      const caregiverId = req.user.caregiverId;

      // التحقق من الصلاحيات
      const lovedOne = await LovedOne.findOne({
        _id: loved_one_id,
        caregivers: caregiverId,
      });

      if (!lovedOne) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const medicalHistory = await MedicalHistory.findOne({
        loved_one: loved_one_id,
      }).populate("last_updated.by", "name");

      if (!medicalHistory) {
        return res.status(404).json({ message: "Medical history not found" });
      }

      res.json(medicalHistory);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // إضافة حالة طبية جديدة
  addCondition: async (req, res) => {
    try {
      const { loved_one_id } = req.params;
      const caregiverId = req.user.caregiverId;
      const condition = req.body;

      const medicalHistory = await MedicalHistory.findOne({
        loved_one: loved_one_id,
      });
      if (!medicalHistory) {
        return res.status(404).json({ message: "Medical history not found" });
      }

      // التحقق من الصلاحيات
      const lovedOne = await LovedOne.findOne({
        _id: loved_one_id,
        caregivers: caregiverId,
      });

      if (!lovedOne) {
        return res.status(403).json({ message: "Not authorized" });
      }

      medicalHistory.conditions.push(condition);
      medicalHistory.last_updated = {
        date: new Date(),
        by: caregiverId,
      };

      await medicalHistory.save();

      res.json(medicalHistory);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // إضافة دواء للتاريخ
  addMedication: async (req, res) => {
    try {
      const { loved_one_id } = req.params;
      const caregiverId = req.user.caregiverId;
      const medication = req.body;

      const medicalHistory = await MedicalHistory.findOne({
        loved_one: loved_one_id,
      });
      if (!medicalHistory) {
        return res.status(404).json({ message: "Medical history not found" });
      }

      // التحقق من الصلاحيات
      const lovedOne = await LovedOne.findOne({
        _id: loved_one_id,
        caregivers: caregiverId,
      });

      if (!lovedOne) {
        return res.status(403).json({ message: "Not authorized" });
      }

      medicalHistory.medications.push(medication);
      medicalHistory.last_updated = {
        date: new Date(),
        by: caregiverId,
      };

      await medicalHistory.save();

      res.json(medicalHistory);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // إضافة وثيقة طبية
  addDocument: async (req, res) => {
    try {
      const { loved_one_id } = req.params;
      const caregiverId = req.user.caregiverId;
      const document = req.body;

      const medicalHistory = await MedicalHistory.findOne({
        loved_one: loved_one_id,
      });
      if (!medicalHistory) {
        return res.status(404).json({ message: "Medical history not found" });
      }

      // التحقق من الصلاحيات
      const lovedOne = await LovedOne.findOne({
        _id: loved_one_id,
        caregivers: caregiverId,
      });

      if (!lovedOne) {
        return res.status(403).json({ message: "Not authorized" });
      }

      medicalHistory.documents.push(document);
      medicalHistory.last_updated = {
        date: new Date(),
        by: caregiverId,
      };

      await medicalHistory.save();

      res.json(medicalHistory);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // تحديث حالة طبية
  updateCondition: async (req, res) => {
    try {
      const { loved_one_id, condition_id } = req.params;
      const caregiverId = req.user.caregiverId;
      const updates = req.body;

      const medicalHistory = await MedicalHistory.findOne({
        loved_one: loved_one_id,
      });
      if (!medicalHistory) {
        return res.status(404).json({ message: "Medical history not found" });
      }

      // التحقق من الصلاحيات
      const lovedOne = await LovedOne.findOne({
        _id: loved_one_id,
        caregivers: caregiverId,
      });

      if (!lovedOne) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const condition = medicalHistory.conditions.id(condition_id);
      if (!condition) {
        return res.status(404).json({ message: "Condition not found" });
      }

      Object.assign(condition, updates);
      medicalHistory.last_updated = {
        date: new Date(),
        by: caregiverId,
      };

      await medicalHistory.save();
      res.json(medicalHistory);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // حذف حالة طبية
  deleteCondition: async (req, res) => {
    try {
      const { loved_one_id, condition_id } = req.params;
      const caregiverId = req.user.caregiverId;

      const medicalHistory = await MedicalHistory.findOne({
        loved_one: loved_one_id,
      });
      if (!medicalHistory) {
        return res.status(404).json({ message: "Medical history not found" });
      }

      // التحقق من الصلاحيات
      const lovedOne = await LovedOne.findOne({
        _id: loved_one_id,
        caregivers: caregiverId,
      });

      if (!lovedOne) {
        return res.status(403).json({ message: "Not authorized" });
      }

      medicalHistory.conditions.pull(condition_id);
      medicalHistory.last_updated = {
        date: new Date(),
        by: caregiverId,
      };

      await medicalHistory.save();
      res.json(medicalHistory);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // البحث في التاريخ الطبي
  search: async (req, res) => {
    try {
      const { loved_one_id } = req.params;
      const { query, type, startDate, endDate } = req.query;
      const caregiverId = req.user.caregiverId;

      // التحقق من الصلاحيات
      const lovedOne = await LovedOne.findOne({
        _id: loved_one_id,
        caregivers: caregiverId,
      });

      if (!lovedOne) {
        return res.status(403).json({ message: "Not authorized" });
      }

      let searchQuery = { loved_one: loved_one_id };

      // إضافة شروط البحث
      if (query) {
        searchQuery.$or = [
          { "conditions.name": { $regex: query, $options: "i" } },
          { "medications.name": { $regex: query, $options: "i" } },
          { "documents.title": { $regex: query, $options: "i" } },
          { notes: { $regex: query, $options: "i" } },
        ];
      }

      if (type) {
        searchQuery["documents.type"] = type;
      }

      if (startDate || endDate) {
        searchQuery.createdAt = {};
        if (startDate) searchQuery.createdAt.$gte = new Date(startDate);
        if (endDate) searchQuery.createdAt.$lte = new Date(endDate);
      }

      const results = await MedicalHistory.find(searchQuery).populate(
        "last_updated.by",
        "name"
      );

      res.json(results);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // تصدير التقرير الطبي
  exportReport: async (req, res) => {
    try {
      const { loved_one_id } = req.params;
      const caregiverId = req.user.caregiverId;

      const medicalHistory = await MedicalHistory.findOne({
        loved_one: loved_one_id,
      })
        .populate("loved_one", "name")
        .populate("last_updated.by", "name");

      if (!medicalHistory) {
        return res.status(404).json({ message: "Medical history not found" });
      }

      // التحقق من الصلاحيات
      const lovedOne = await LovedOne.findOne({
        _id: loved_one_id,
        caregivers: caregiverId,
      });

      if (!lovedOne) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // تنظيم البيانات للتصدير
      const report = {
        patient: lovedOne.name,
        generated_at: new Date(),
        generated_by: req.user.name,
        medical_conditions: medicalHistory.conditions.map((c) => ({
          condition: c.name,
          status: c.status,
          diagnosed: c.diagnosis_date,
          severity: c.severity,
          notes: c.notes,
        })),
        current_medications: medicalHistory.medications
          .filter((m) => !m.end_date)
          .map((m) => ({
            medication: m.name,
            dosage: m.dosage,
            started: m.start_date,
            reason: m.reason,
            effectiveness: m.effectiveness,
          })),
        allergies: medicalHistory.allergies.map((a) => ({
          allergen: a.allergen,
          reaction: a.reaction,
          severity: a.severity,
        })),
        recent_documents: medicalHistory.documents
          .sort((a, b) => b.date - a.date)
          .slice(0, 5),
      };

      res.json(report);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = medicalHistoryController;
