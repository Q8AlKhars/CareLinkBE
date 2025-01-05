const CarePlan = require("../models/CarePlan");
const LovedOne = require("../models/LovedOne");
const ActivityLog = require("../models/ActivityLog");

const carePlanController = {
  create: async (req, res) => {
    try {
      const { loved_one_id } = req.params;
      const { title, description, goals, schedule, status, notes } = req.body;
      const caregiverId = req.user.caregiverId;

      const lovedOne = await LovedOne.findOne({
        _id: loved_one_id,
        caregivers: caregiverId,
      });

      if (!lovedOne) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const carePlan = new CarePlan({
        loved_one: loved_one_id,
        title,
        description,
        goals,
        schedule,
        status,
        notes,
        created_by: caregiverId,
      });

      await carePlan.save();

      await LovedOne.findByIdAndUpdate(loved_one_id, {
        $push: { care_plans: carePlan._id },
      });

      await new ActivityLog({
        description: `Care plan created: ${title}`,
        caregiver: caregiverId,
        action_type: "CARE_PLAN_CREATE",
        metadata: new Map([
          ["care_plan_id", carePlan._id.toString()],
          ["loved_one_id", loved_one_id],
        ]),
      }).save();

      res.status(201).json(carePlan);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = carePlanController;
