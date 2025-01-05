const Notification = require("../models/Notification");
const Medication = require("../models/Medication");
const CarePlan = require("../models/CarePlan");
const ActivityLog = require("../models/ActivityLog");

const notificationController = {
  // إنشاء إشعار
  create: async (req, res) => {
    try {
      const {
        recipient,
        type,
        title,
        message,
        reference,
        referenceModel,
        scheduled_for,
        priority,
        metadata,
      } = req.body;
      const caregiverId = req.user.caregiverId;

      const notification = new Notification({
        recipient,
        type,
        title,
        message,
        reference,
        referenceModel,
        scheduled_for,
        priority,
        metadata,
      });

      await notification.save();

      // تسجيل النشاط
      await new ActivityLog({
        description: `Notification created: ${type}`,
        caregiver: caregiverId,
        action_type: "NOTIFICATION_CREATE",
        metadata: new Map([
          ["notification_id", notification._id.toString()],
          ["type", type],
        ]),
      }).save();

      res.status(201).json(notification);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // تحديث حالة الإشعار
  updateStatus: async (req, res) => {
    try {
      const { notification_id } = req.params;
      const { status } = req.body;
      const caregiverId = req.user.caregiverId;

      const notification = await Notification.findOne({
        _id: notification_id,
        recipient: caregiverId,
      });

      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      notification.status = status;
      await notification.save();

      res.json(notification);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // جلب إشعارات مقدم الرعاية
  getByCaregiver: async (req, res) => {
    try {
      const { status, type } = req.query;
      const caregiverId = req.user.caregiverId;

      const query = { recipient: caregiverId };

      if (status) {
        query.status = status;
      }

      if (type) {
        query.type = type;
      }

      const notifications = await Notification.find(query)
        .populate("reference")
        .sort({ createdAt: -1 });

      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // إنشاء تذكير دواء
  createMedicationReminder: async (req, res) => {
    try {
      const { medication_id, scheduled_for } = req.body;
      const caregiverId = req.user.caregiverId;

      const medication = await Medication.findById(medication_id).populate(
        "loved_one",
        "name"
      );

      if (!medication) {
        return res.status(404).json({ message: "Medication not found" });
      }

      const notification = new Notification({
        recipient: caregiverId,
        type: "MEDICATION_REMINDER",
        title: "تذكير بموعد الدواء",
        message: `حان موعد إعطاء ${medication.name} لـ ${medication.loved_one.name}`,
        reference: medication_id,
        referenceModel: "Medication",
        scheduled_for,
        priority: "HIGH",
      });

      await notification.save();

      res.status(201).json(notification);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // إنشاء إشعار تحديث خطة الرعاية
  createCarePlanUpdateNotification: async (req, res) => {
    try {
      const { care_plan_id, recipients } = req.body;
      const caregiverId = req.user.caregiverId;

      const carePlan = await CarePlan.findById(care_plan_id).populate(
        "loved_one",
        "name"
      );

      if (!carePlan) {
        return res.status(404).json({ message: "Care plan not found" });
      }

      const notifications = await Promise.all(
        recipients.map(async (recipientId) => {
          const notification = new Notification({
            recipient: recipientId,
            type: "CARE_PLAN_UPDATE",
            title: "تحديث خطة الرعاية",
            message: `تم تحديث خطة الرعاية لـ ${carePlan.loved_one.name}`,
            reference: care_plan_id,
            referenceModel: "CarePlan",
            priority: "MEDIUM",
          });

          return notification.save();
        })
      );

      res.status(201).json(notifications);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = notificationController;
