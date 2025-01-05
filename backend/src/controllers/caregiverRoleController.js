const caregiverRoleService = require("../services/caregiverRoleService");
const ActivityLog = require("../models/ActivityLog");

const caregiverRoleController = {
  // عرض جميع الأدوار لمقدم الرعاية
  getRoles: async (req, res) => {
    try {
      const caregiverId = req.user.caregiverId;
      const roles = await caregiverRoleService.getCaregiverRoles(caregiverId);
      res.json(roles);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // تغيير دور مقدم الرعاية
  changeRole: async (req, res) => {
    try {
      const { loved_one_id, role } = req.body;
      const caregiverId = req.user.caregiverId;

      const updatedLovedOne = await caregiverRoleService.changeCaregiverRole(
        caregiverId,
        loved_one_id,
        role
      );

      // تسجيل النشاط
      await new ActivityLog({
        description: `تم تغيير دور مقدم الرعاية إلى ${role}`,
        caregiver: caregiverId,
        action_type: "ROLE_CHANGE",
      }).save();

      res.json(updatedLovedOne);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // التحقق من دور مقدم الرعاية لمريض معين
  checkRole: async (req, res) => {
    try {
      const { loved_one_id } = req.params;
      const caregiverId = req.user.caregiverId;

      const access = await caregiverRoleService.validateCaregiverAccess(
        caregiverId,
        loved_one_id
      );

      res.json(access);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = caregiverRoleController;
