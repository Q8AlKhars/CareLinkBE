const mongoose = require("mongoose");

const caregiverInvitationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  lovedOne: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LovedOne",
    required: true,
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Caregiver",
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["PENDING", "ACCEPTED", "REJECTED"],
    default: "PENDING",
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 172800, // 48 ساعة
  },
});

module.exports = mongoose.model(
  "CaregiverInvitation",
  caregiverInvitationSchema
);
