const LovedOne = require("../models/LovedOne");
const MedicalHistory = require("../models/MedicalHistory");
const ActivityLog = require("../models/ActivityLog");
const fs = require("fs").promises;
const path = require("path");
const Caregiver = require("../models/Caregiver");

const lovedOneController = {
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const caregiverId = req.user.caregiverId;

      const lovedOne = await LovedOne.findOne({
        _id: id,
        caregivers: caregiverId,
      });

      if (!lovedOne) {
        return res
          .status(404)
          .json({ message: "الشخص المحتاج للرعاية غير موجود" });
      }

      res.json(lovedOne);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const caregiverId = req.user.caregiverId;

      // التحقق من وجود مقدم الرعاية وصلاحياته
      const caregiver = await Caregiver.findById(caregiverId);
      if (!caregiver) {
        return res.status(404).json({ message: "مقدم الرعاية غير موجود" });
      }

      // التحقق من وجود المريض
      const lovedOne = await LovedOne.findOne({
        _id: id,
        caregivers: caregiverId,
      });

      if (!lovedOne) {
        return res.status(404).json({ message: "المريض غير موجود" });
      }

      // التحقق من الصلاحيات
      const isPrimary = lovedOne.primary_caregiver.toString() === caregiverId;
      if (!isPrimary && !caregiver.permissions.includes("WRITE")) {
        return res.status(403).json({
          message: "ليس لديك صلاحية التعديل",
          current_permissions: caregiver.permissions,
        });
      }

      // تحديث البيانات
      const updatedLovedOne = await LovedOne.findByIdAndUpdate(id, updates, {
        new: true,
      });

      // تسجيل النشاط
      await new ActivityLog({
        description: `تم تحديث بيانات المريض ${updatedLovedOne.name}`,
        caregiver: caregiverId,
        loved_one: id,
        action_type: "UPDATE",
        details: updates,
      }).save();

      res.json(updatedLovedOne);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const caregiverId = req.user.caregiverId;

      const lovedOne = await LovedOne.findOneAndDelete({
        _id: id,
        primary_caregiver: caregiverId,
      });

      if (!lovedOne) {
        return res
          .status(404)
          .json({ message: "الشخص المحتاج للرعاية غير موجود" });
      }

      res.json({ message: "تم حذف الشخص المحتاج للرعاية بنجاح" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getMedicalHistory: async (req, res) => {
    try {
      const { id } = req.params;
      const caregiverId = req.user.caregiverId;

      const lovedOne = await LovedOne.findOne({
        _id: id,
        caregivers: caregiverId,
      });

      if (!lovedOne) {
        return res
          .status(404)
          .json({ message: "الشخص المحتاج للرعاية غير موجود" });
      }

      const medicalHistory = await MedicalHistory.find({ loved_one: id }).sort({
        date: -1,
      });

      res.json(medicalHistory);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  addMedicalHistory: async (req, res) => {
    try {
      const { id } = req.params;
      const caregiverId = req.user.caregiverId;
      const medicalData = req.body;

      const lovedOne = await LovedOne.findOne({
        _id: id,
        caregivers: caregiverId,
      });

      if (!lovedOne) {
        return res
          .status(404)
          .json({ message: "الشخص المحتاج للرعاية غير موجود" });
      }

      const medicalHistory = new MedicalHistory({
        ...medicalData,
        loved_one: id,
      });
      await medicalHistory.save();

      res.status(201).json(medicalHistory);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getCaregivers: async (req, res) => {
    try {
      const { id } = req.params;
      const caregiverId = req.user.caregiverId;

      const lovedOne = await LovedOne.findOne({
        _id: id,
        caregivers: caregiverId,
      }).populate({
        path: "caregivers",
        populate: {
          path: "user",
          select: "name email phone_number",
        },
        select: "role permissions user",
      });

      if (!lovedOne) {
        return res
          .status(403)
          .json({ message: "Not authorized to view this information" });
      }

      res.json(lovedOne.caregivers);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  addCaregiver: async (req, res) => {
    try {
      const { id } = req.params;
      const { caregiverId: newCaregiverId } = req.body;
      const currentCaregiverId = req.user.caregiverId;

      const lovedOne = await LovedOne.findOneAndUpdate(
        {
          _id: id,
          primary_caregiver: currentCaregiverId,
        },
        {
          $addToSet: { caregivers: newCaregiverId },
        },
        { new: true }
      );

      if (!lovedOne) {
        return res
          .status(404)
          .json({ message: "الشخص المحتاج للرعاية غير موجود" });
      }

      res.json(lovedOne);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  removeCaregiver: async (req, res) => {
    try {
      const { id, caregiverId: removedCaregiverId } = req.params;
      const currentCaregiverId = req.user.caregiverId;

      const lovedOne = await LovedOne.findOneAndUpdate(
        {
          _id: id,
          primary_caregiver: currentCaregiverId,
        },
        {
          $pull: { caregivers: removedCaregiverId },
        },
        { new: true }
      );

      if (!lovedOne) {
        return res
          .status(404)
          .json({ message: "الشخص المحتاج للرعاية غير موجود" });
      }

      res.json(lovedOne);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  uploadProfileImage: async (req, res) => {
    try {
      const { loved_one_id } = req.params;
      const caregiverId = req.user.caregiverId;

      // التحقق من وجود مقدم الرعاية وصلاحياته
      const caregiver = await Caregiver.findById(caregiverId);
      if (!caregiver) {
        return res.status(404).json({ message: "مقدم الرعاية غير موجود" });
      }

      // التحقق من وجود المريض
      const lovedOne = await LovedOne.findOne({
        _id: loved_one_id,
        caregivers: caregiverId,
      });

      if (!lovedOne) {
        return res.status(403).json({ message: "غير مصرح بهذا الإجراء" });
      }

      // التحقق من الصلاحيات
      const isPrimary = lovedOne.primary_caregiver.toString() === caregiverId;
      if (!isPrimary && !caregiver.permissions.includes("WRITE")) {
        return res.status(403).json({
          message: "ليس لديك صلاحية رفع الصور",
          current_permissions: caregiver.permissions,
        });
      }

      if (!req.file) {
        return res.status(400).json({ message: "لم يتم تحميل أي صورة" });
      }

      // حذف الصورة القديمة إذا وجدت
      if (lovedOne.profile_image?.path) {
        const oldImagePath = path.join(
          __dirname,
          "../../",
          lovedOne.profile_image.path
        );
        try {
          await fs.unlink(oldImagePath);
        } catch (error) {
          console.log("خطأ في حذف الصورة القديمة:", error);
        }
      }

      // تحديث الصورة الجديدة
      const updatedLovedOne = await LovedOne.findByIdAndUpdate(
        loved_one_id,
        {
          profile_image: {
            filename: req.file.filename,
            path: req.file.path,
          },
        },
        { new: true }
      );

      res.json(updatedLovedOne);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  deleteProfileImage: async (req, res) => {
    try {
      const { loved_one_id } = req.params;
      const caregiverId = req.user.caregiverId;

      // التحقق من وجود مقدم الرعاية وصلاحياته
      const caregiver = await Caregiver.findById(caregiverId);
      if (!caregiver) {
        return res.status(404).json({ message: "مقدم الرعاية غير موجود" });
      }

      // التحقق من وجود المريض
      const lovedOne = await LovedOne.findOne({
        _id: loved_one_id,
        caregivers: caregiverId,
      });

      if (!lovedOne) {
        return res.status(403).json({ message: "غير مصرح بهذا الإجراء" });
      }

      // التحقق من الصلاحيات
      const isPrimary = lovedOne.primary_caregiver.toString() === caregiverId;
      if (!isPrimary && !caregiver.permissions.includes("WRITE")) {
        return res.status(403).json({
          message: "ليس لديك صلاحية الحذف",
          current_permissions: caregiver.permissions,
        });
      }

      // حذف الصورة من المجلد
      if (lovedOne.profile_image?.path) {
        const imagePath = path.join(
          __dirname,
          "../../",
          lovedOne.profile_image.path
        );
        try {
          await fs.unlink(imagePath);
        } catch (error) {
          console.log("خطأ في حذف الصورة:", error);
        }
      }

      // تحديث قاعدة البيانات
      const updatedLovedOne = await LovedOne.findByIdAndUpdate(
        loved_one_id,
        {
          $unset: { profile_image: "" },
        },
        { new: true }
      );

      res.json(updatedLovedOne);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = lovedOneController;
