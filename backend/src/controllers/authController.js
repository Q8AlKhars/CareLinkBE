const User = require("../models/User");
const Caregiver = require("../models/Caregiver");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const BlacklistedToken = require("../models/BlacklistedToken");
const config = require("../config/auth");
const TwoFactorToken = require("../models/TwoFactorToken");
const emailService = require("../services/emailService");
const speakeasy = require("speakeasy");
const authService = require("../services/authService");

const authController = {
  register: async (req, res) => {
    try {
      const { name, email, password, phone_number } = req.body;

      // التحقق من وجود المستخدم
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "البريد الإلكتروني مستخدم مسبقاً" });
      }

      // إنشاء رمز تحقق
      const verificationCode = speakeasy.totp({
        secret: speakeasy.generateSecret().base32,
        digits: 6,
      });

      // حرسال رمز التحقق بالبريد
      await emailService.sendVerificationCode(email, verificationCode);

      // حفظ البيانات مؤقتاً
      await TwoFactorToken.create({
        email,
        name,
        phone_number,
        password,
        token: verificationCode,
      });

      res.json({
        message: "تم إرسال رمز التحقق إلى بريدك الإلكتروني",
        email,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  verifyAndCompleteRegistration: async (req, res) => {
    try {
      const { email, code } = req.body;

      // التحقق من الرمز
      const tokenDoc = await TwoFactorToken.findOne({
        email,
        token: code,
      });

      if (!tokenDoc) {
        return res.status(401).json({ message: "رمز التحقق غير صحيح" });
      }

      // حنشاء المستخدم
      const hashedPassword = await bcrypt.hash(tokenDoc.password, 10);
      const user = new User({
        name: tokenDoc.name,
        email,
        password: hashedPassword,
        phone_number: tokenDoc.phone_number,
        is_verified: true,
      });
      await user.save();

      // إنشاء مقدم رعاية بدون دور محدد
      const caregiver = new Caregiver({
        user: user._id,
        name: user.name,
        permissions: ["READ", "WRITE", "DELETE"],
      });
      await caregiver.save();

      // حذف البيانات المؤقتة
      await TwoFactorToken.deleteOne({ _id: tokenDoc._id });

      // إنشاء توكن وإرجاع البيانات
      const token = jwt.sign(
        { userId: user._id, caregiverId: caregiver._id },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.status(201).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "بيانات الدخول غير صحيحة" });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: "بيانات الدخول غير صحيحة" });
      }

      const caregiver = await Caregiver.findOne({ user: user._id });
      const token = jwt.sign(
        { userId: user._id, caregiverId: caregiver._id },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: caregiver.role,
        },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  verifyToken: async (req, res) => {
    try {
      const user = await User.findById(req.user.userId);
      const caregiver = await Caregiver.findOne({ user: user._id });

      res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: caregiver.role,
        },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  logout: async (req, res) => {
    try {
      const token = req.header("Authorization").replace("Bearer ", "");

      // تحليل التوكن للحصول على وقت انتهاء الصلاحية
      const decoded = jwt.verify(token, config.jwtSecret);
      const expiresAt = new Date(decoded.exp * 1000);

      // إضافة التوكن إلى القائمة السوداء
      await BlacklistedToken.create({
        token,
        expiresAt,
      });

      res.json({ message: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  verify2FA: async (req, res) => {
    try {
      const { userId, code } = req.body;

      // التحقق من الرمز
      const tokenDoc = await TwoFactorToken.findOne({
        user: userId,
        token: code,
      });

      if (!tokenDoc) {
        return res.status(401).json({ message: "رمز التحقق غير صحيح" });
      }

      // حذف الرمز بعد استخدامه
      await TwoFactorToken.deleteOne({ _id: tokenDoc._id });

      // إنشاء توكن الدخول
      const user = await User.findById(userId);
      const token = user.generateAuthToken();

      res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  changePassword: async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.user.userId;

      await authService.changePassword(userId, oldPassword, newPassword);

      res.json({ message: "تم تغيير كلمة المرور بنجاح" });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
};

module.exports = authController;
