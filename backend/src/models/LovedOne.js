const mongoose = require("mongoose");

const lovedOneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    profile_image: {
      filename: String,
      path: String,
    },
    age: {
      type: Number,
      required: true,
    },
    medical_history: {
      type: String,
    },
    primary_caregiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Caregiver",
      required: true,
    },
    caregivers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Caregiver",
      },
    ],
    care_plans: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CarePlan",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("LovedOne", lovedOneSchema);
