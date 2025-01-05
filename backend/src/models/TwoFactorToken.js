const mongoose = require("mongoose");

const twoFactorTokenSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  name: String,
  phone_number: String,
  password: String,
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // يحذف تلقائياً بعد 5 دقائق
  },
});

module.exports = mongoose.model("TwoFactorToken", twoFactorTokenSchema);
