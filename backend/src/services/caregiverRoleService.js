const LovedOne = require("../models/LovedOne");
const Caregiver = require("../models/Caregiver");

const caregiverRoleService = {
  // الحصول على جميع الأدوار لمقدم رعاية معين
  async getCaregiverRoles(caregiverId) {
    const roles = {
      primary: [], // المرضى الذين هو مقدم رعايتهم الأساسي
      secondary: [], // المرضى الذين هو مقدم رعاية ثانوي لهم
    };

    // البحث عن المرضى حيث هو مقدم الرعاية الأساسي
    roles.primary = await LovedOne.find({
      primary_caregiver: caregiverId,
    }).select("name age medical_history");

    // البحث عن المرضى حيث هو مقدم رعاية ثانوي
    roles.secondary = await LovedOne.find({
      caregivers: caregiverId,
      primary_caregiver: { $ne: caregiverId },
    }).select("name age medical_history primary_caregiver");

    return roles;
  },

  // تغيير دور مقدم الرعاية لمريض معين
  async changeCaregiverRole(caregiverId, lovedOneId, newRole) {
    const lovedOne = await LovedOne.findById(lovedOneId);
    if (!lovedOne) {
      throw new Error("المريض غير موجود");
    }

    if (newRole === "PRIMARY") {
      // التأكد من أن المريض ليس لديه مقدم رعاية أساسي آخر
      if (
        lovedOne.primary_caregiver &&
        lovedOne.primary_caregiver.toString() !== caregiverId
      ) {
        throw new Error("المريض لديه مقدم رعاية أساسي بالفعل");
      }

      // تعيين كمقدم رعاية أساسي
      lovedOne.primary_caregiver = caregiverId;
      if (!lovedOne.caregivers.includes(caregiverId)) {
        lovedOne.caregivers.push(caregiverId);
      }
    } else if (newRole === "SECONDARY") {
      // التأكد من أنه ليس مقدم الرعاية الأساسي
      if (lovedOne.primary_caregiver.toString() === caregiverId) {
        throw new Error("لا يمكن تغيير دور مقدم الرعاية الأساسي إلى ثانوي");
      }

      // إضافة كمقدم رعاية ثانوي
      if (!lovedOne.caregivers.includes(caregiverId)) {
        lovedOne.caregivers.push(caregiverId);
      }
    }

    await lovedOne.save();
    return lovedOne;
  },

  // التحقق من صلاحيات مقدم الرعاية
  async validateCaregiverAccess(caregiverId, lovedOneId) {
    const lovedOne = await LovedOne.findById(lovedOneId);
    if (!lovedOne) {
      return { hasAccess: false, role: null };
    }

    const isPrimary = lovedOne.primary_caregiver.toString() === caregiverId;
    const isSecondary = lovedOne.caregivers.includes(caregiverId);

    return {
      hasAccess: isPrimary || isSecondary,
      role: isPrimary ? "PRIMARY" : isSecondary ? "SECONDARY" : null,
      lovedOne,
    };
  },
};

module.exports = caregiverRoleService;
