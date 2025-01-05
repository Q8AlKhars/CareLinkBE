const bcrypt = require("bcryptjs");
const User = require("../models/User");

const authService = {
  async changePassword(userId, oldPassword, newPassword) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("المستخدم غير موجود");
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      throw new Error("كلمة المرور الحالية غير صحيحة");
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return true;
  },
};

module.exports = authService;
