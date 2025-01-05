const DailyNote = require("../models/DailyNote");
const LovedOne = require("../models/LovedOne");
const CarePlan = require("../models/CarePlan");
const ActivityLog = require("../models/ActivityLog");

const noteController = {
  // إضافة ملاحظة جديدة
  create: async (req, res) => {
    try {
      const { content, loved_one_id, care_plan, type, tags, mood, metrics } =
        req.body;

      const caregiverId = req.user.caregiverId;

      // التحقق من الصلاحيات
      const lovedOne = await LovedOne.findOne({
        _id: loved_one_id,
        caregivers: caregiverId,
      });

      if (!lovedOne) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // التحقق من خطة الرعاية إذا وجدت
      if (care_plan) {
        const carePlan = await CarePlan.findById(care_plan);
        if (!carePlan) {
          return res.status(404).json({ message: "Care plan not found" });
        }
        if (carePlan.loved_one.toString() !== loved_one_id) {
          return res.status(400).json({
            message: "Note and care plan must belong to the same loved one",
          });
        }
      }

      const note = new DailyNote({
        content,
        loved_one: loved_one_id,
        care_plan,
        caregiver: caregiverId,
        type,
        tags,
        mood,
        metrics,
      });

      await note.save();

      // إضافة الملاحظة لخطة الرعاية إذا وجدت
      if (care_plan) {
        await CarePlan.findByIdAndUpdate(
          care_plan,
          { $push: { notes: note._id } },
          { new: true }
        );
      }

      // تسجيل النشاط
      await new ActivityLog({
        description: `New note added: ${type}`,
        caregiver: caregiverId,
        action_type: "NOTE_ADDED",
        metadata: new Map([
          ["note_id", note._id.toString()],
          ["care_plan", care_plan],
        ]),
      }).save();

      res.status(201).json(note);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = noteController;
