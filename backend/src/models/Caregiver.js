const mongoose = require("mongoose");

const caregiverSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    profile_image: {
      filename: String,
      path: String,
    },
    role: {
      type: String,
      enum: ["PRIMARY", "SECONDARY"],
    },
    loved_ones: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LovedOne",
      },
    ],
    permissions: {
      type: [String],
      default: ["READ", "WRITE", "DELETE"],
    },
  },
  { timestamps: true }
);

// قبل الحفظ، إذا لم يكن هناك اسم، استخدم اسم المستخدم
caregiverSchema.pre("save", async function (next) {
  if (!this.name && this.user) {
    const User = mongoose.model("User");
    const user = await User.findById(this.user);
    if (user) {
      this.name = user.name;
    }
  }
  next();
});

module.exports = mongoose.model("Caregiver", caregiverSchema);
