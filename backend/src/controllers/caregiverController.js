const Caregiver = require("../models/Caregiver");
const LovedOne = require("../models/LovedOne");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const config = require("../config/auth");
const emailService = require("../services/emailService");
const CaregiverInvitation = require("../models/CaregiverInvitation");
const crypto = require("crypto");

const caregiverController = {
  addLovedOne: async (req, res) => {
    try {
      const { name, age, medical_history } = req.body;
      const caregiverId = req.user.caregiverId;

      // إنشاء شخص محتاج للرعاية جديد
      const lovedOne = new LovedOne({
        name,
        age,
        medical_history,
        primary_caregiver: caregiverId,
        caregivers: [caregiverId],
      });
      await lovedOne.save();

      // تحديث قائمة الأشخاص المحتاجين للرعاية لمقدم الرعاية وتعيين دوره كأساسي
      await Caregiver.findByIdAndUpdate(caregiverId, {
        $push: { loved_ones: lovedOne._id },
        $set: { role: "PRIMARY" },
      });

      res.status(201).json(lovedOne);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  assignRole: async (req, res) => {
    try {
      const { email, lovedOneId } = req.body;
      const primaryCaregiverId = req.user.caregiverId;

      // التحقق من المريض والصلاحيات
      const lovedOne = await LovedOne.findById(lovedOneId);
      if (
        !lovedOne ||
        lovedOne.primary_caregiver.toString() !== primaryCaregiverId
      ) {
        return res.status(403).json({ message: "غير مصرح بهذا الإجراء" });
      }

      // إنشاء توكن للدعوة
      const invitationToken = crypto.randomBytes(32).toString("hex");

      // حفظ الدعوة
      await CaregiverInvitation.create({
        email,
        lovedOne: lovedOneId,
        invitedBy: primaryCaregiverId,
        token: invitationToken,
      });

      // إرسال الدعوة بالبريد
      await emailService.sendCaregiverInvitation(
        email,
        lovedOne.name,
        invitationToken
      );

      res.json({ message: "تم إرسال الدعوة بنجاح" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getLovedOnes: async (req, res) => {
    try {
      const caregiverId = req.user.caregiverId;
      const caregiver = await Caregiver.findById(caregiverId).populate(
        "loved_ones"
      );
      res.json(caregiver.loved_ones);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  updatePermissions: async (req, res) => {
    try {
      const { id } = req.params;
      const { permissions } = req.body;
      const primaryCaregiverId = req.user.caregiverId;

      // البحث عن مقدم الرعاية المراد تحديث صلاحياته
      const caregiver = await Caregiver.findById(id);
      if (!caregiver) {
        return res.status(404).json({ message: "Caregiver not found" });
      }

      // البحث عن الأشخاص المحتاجين للرعاية المشتركين
      const lovedOnes = await LovedOne.find({
        caregivers: { $all: [id, primaryCaregiverId] },
        primary_caregiver: primaryCaregiverId,
      });

      if (lovedOnes.length === 0) {
        return res
          .status(403)
          .json({ message: "Not authorized to update permissions" });
      }

      // تحديث الصلاحيات فقط
      const updatedCaregiver = await Caregiver.findByIdAndUpdate(
        id,
        { $set: { permissions: permissions } },
        {
          new: true,
          runValidators: false, // تجاهل التحقق من الحقول الأخرى
        }
      );

      res.json({
        message: "Permissions updated successfully",
        caregiver: {
          _id: updatedCaregiver._id,
          permissions: updatedCaregiver.permissions,
          role: updatedCaregiver.role,
        },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  removeCaregiver: async (req, res) => {
    try {
      const { id } = req.params;
      const primaryCaregiverId = req.user.caregiverId;

      // البحث عن مقدم الرعاية المراد إزالته
      const caregiver = await Caregiver.findById(id);
      if (!caregiver) {
        return res.status(404).json({ message: "Caregiver not found" });
      }

      // البحث عن الأشخاص المحتاجين للرعاية المشتركين
      const lovedOnes = await LovedOne.find({
        caregivers: { $all: [id, primaryCaregiverId] },
        primary_caregiver: primaryCaregiverId,
      });

      if (lovedOnes.length === 0) {
        return res
          .status(403)
          .json({ message: "Not authorized to remove this caregiver" });
      }

      // إزالة مقدم الرعاية من جميع الأشخاص المحتاجين للرعاية
      await LovedOne.updateMany(
        { _id: { $in: lovedOnes.map((lo) => lo._id) } },
        { $pull: { caregivers: id } }
      );

      res.json({ message: "Caregiver removed successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  uploadProfileImage: async (req, res) => {
    try {
      const caregiverId = req.user.caregiverId;

      if (!req.file) {
        return res.status(400).json({ message: "لم يتم تحميل أي صورة" });
      }

      const caregiver = await Caregiver.findByIdAndUpdate(
        caregiverId,
        {
          profile_image: {
            filename: req.file.filename,
            path: req.file.path,
          },
        },
        { new: true }
      );

      res.json(caregiver);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  acceptInvitation: async (req, res) => {
    try {
      const { token } = req.params;
      const { email, password } = req.body;

      console.log("Token:", token);
      console.log("Email from request:", email);

      // البحث عن الدعوة
      const invitation = await CaregiverInvitation.findOne({
        token,
        status: "PENDING",
      }).populate("lovedOne");

      console.log("Found invitation:", invitation);

      if (!invitation) {
        return res
          .status(404)
          .json({ message: "الدعوة غير صالحة أو منتهية الصلاحية" });
      }

      console.log("Invitation email:", invitation.email);
      console.log("Request email:", email);

      // التحقق من البريد الإلكتروني
      if (invitation.email.toLowerCase() !== email.toLowerCase()) {
        return res
          .status(400)
          .json({ message: "البريد الإلكتروني غير مطابق للدعوة" });
      }

      // البحث عن المستخدم أو إنشاء حساب جديد
      let user = await User.findOne({ email });
      if (!user) {
        const hashedPassword = await bcrypt.hash(password, 10);
        user = new User({
          email,
          password: hashedPassword,
          name: email.split("@")[0],
        });
        await user.save();
      }

      // إنشاء أو تحديث مقدم الرعاية
      let caregiver = await Caregiver.findOne({ user: user._id });
      if (!caregiver) {
        caregiver = new Caregiver({
          user: user._id,
          name: user.name,
          role: "SECONDARY",
          permissions: ["READ", "WRITE"],
        });
        await caregiver.save();
      }

      // إضافة مقدم الرعاية للمريض
      await LovedOne.findByIdAndUpdate(invitation.lovedOne._id, {
        $addToSet: { caregivers: caregiver._id },
      });

      // تحديث حالة الدعوة
      invitation.status = "ACCEPTED";
      await invitation.save();

      res.json({
        message: "تم قبول الدعوة بنجاح",
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (error) {
      console.error("Error in acceptInvitation:", error);
      res.status(500).json({ message: error.message });
    }
  },

  rejectInvitation: async (req, res) => {
    try {
      const { token } = req.params;

      const invitation = await CaregiverInvitation.findOne({
        token,
        status: "PENDING",
      });

      if (!invitation) {
        return res
          .status(404)
          .json({ message: "الدعوة غير صالحة أو منتهية الصلاحية" });
      }

      invitation.status = "REJECTED";
      await invitation.save();

      res.json({ message: "تم رفض الدعوة" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = caregiverController;
