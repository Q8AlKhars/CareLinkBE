const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    }, // min and max 8 characters
    phone_number: {
      type: String,
      required: false,
    },
    is_verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// دالة مقارنة كلمة المرور
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

// دالة إنشاء توكن المصادقة
userSchema.methods.generateAuthToken = async function () {
  const caregiver = await mongoose
    .model("Caregiver")
    .findOne({ user: this._id });
  const token = jwt.sign(
    { userId: this._id, caregiverId: caregiver._id },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );
  return token;
};

module.exports = mongoose.model("User", userSchema);
