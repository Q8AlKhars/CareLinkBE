const Caregiver = require("../models/Caregiver");

const roleCheck = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const caregiver = await Caregiver.findById(req.user.caregiverId);

      if (!caregiver) {
        return res.status(403).json({ message: "غير مصرح لك بهذا الإجراء" });
      }

      if (!allowedRoles.includes(caregiver.role)) {
        return res.status(403).json({ message: "غير مصرح لك بهذا الإجراء" });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
};

module.exports = roleCheck;
