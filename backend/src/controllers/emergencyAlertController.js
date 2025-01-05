const EmergencyAlert = require("../models/EmergencyAlert");
const LovedOne = require("../models/LovedOne");
const ActivityLog = require("../models/ActivityLog");
const Caregiver = require("../models/Caregiver");

const emergencyAlertController = {
  // إنشاء تنبيه طوارئ
  create: async (req, res) => {
    try {
      const { loved_one_id } = req.params;
      const {
        type,
        priority,
        description,
        location,
        response_needed_by,
        task,
      } = req.body;
      const caregiverId = req.user.caregiverId;

      // التحقق من الصلاحيات
      const lovedOne = await LovedOne.findOne({
        _id: loved_one_id,
        caregivers: caregiverId,
      });

      if (!lovedOne) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // إنشاء التنبيه
      const alert = new EmergencyAlert({
        loved_one: loved_one_id,
        requester: caregiverId,
        type,
        priority,
        description,
        location,
        response_needed_by,
        task,
      });

      await alert.save();

      // إرسال الإشعارات لمقدمي الرعاية الآخرين
      const otherCaregivers = lovedOne.caregivers.filter(
        (cg) => cg.toString() !== caregiverId
      );

      const notifications = otherCaregivers.map((cg) => ({
        caregiver: cg,
        sent_at: new Date(),
      }));

      alert.notifications_sent = notifications;
      await alert.save();

      // تسجيل النشاط
      await new ActivityLog({
        description: `Emergency alert created: ${type}`,
        caregiver: caregiverId,
        action_type: "EMERGENCY_ALERT",
        metadata: new Map([
          ["alert_id", alert._id.toString()],
          ["loved_one_id", loved_one_id],
        ]),
      }).save();

      res.status(201).json(alert);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // الاستجابة لتنبيه طوارئ
  respond: async (req, res) => {
    try {
      const { alert_id } = req.params;
      const { status, notes } = req.body;
      const caregiverId = req.user.caregiverId;

      const alert = await EmergencyAlert.findById(alert_id);
      if (!alert) {
        return res.status(404).json({ message: "Alert not found" });
      }

      // التحقق من الصلاحيات
      const lovedOne = await LovedOne.findOne({
        _id: alert.loved_one,
        caregivers: caregiverId,
      });

      if (!lovedOne) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // التحقق من صلاحية الإلغاء
      if (status === "CANCELLED") {
        const caregiver = await Caregiver.findById(caregiverId);
        const isAuthorized =
          alert.requester.toString() === caregiverId || // منشئ التنبيه
          (alert.responder &&
            alert.responder.caregiver.toString() === caregiverId) || // المستجيب
          caregiver.role === "PRIMARY"; // مقدم الرعاية الأساسي

        if (!isAuthorized) {
          return res.status(403).json({
            message: "Not authorized to cancel this alert",
          });
        }
      }

      // تحديث حالة التنبيه
      alert.status = status;
      if (status === "ACCEPTED") {
        alert.responder = {
          caregiver: caregiverId,
          response_time: new Date(),
          notes,
        };
      }

      await alert.save();

      // تسجيل النشاط
      await new ActivityLog({
        description: `Emergency alert ${status.toLowerCase()}: ${alert.type}`,
        caregiver: caregiverId,
        action_type: "EMERGENCY_ALERT",
        metadata: new Map([
          ["alert_id", alert_id],
          ["status", status],
        ]),
      }).save();

      res.json(alert);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // جلب تنبيهات شخص محتاج للرعاية
  getByLovedOne: async (req, res) => {
    try {
      const { loved_one_id } = req.params;
      const { status } = req.query;
      const caregiverId = req.user.caregiverId;

      // التحقق من الصلاحيات
      const lovedOne = await LovedOne.findOne({
        _id: loved_one_id,
        caregivers: caregiverId,
      });

      if (!lovedOne) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // بناء الاستعلام
      const query = { loved_one: loved_one_id };
      if (status) {
        query.status = status;
      }

      const alerts = await EmergencyAlert.find(query)
        .populate("requester", "name")
        .populate("responder.caregiver", "name")
        .populate("task", "title description due_date")
        .sort({ createdAt: -1 });

      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // تحديث حالة الإشعار
  updateNotificationStatus: async (req, res) => {
    try {
      const { alert_id } = req.params;
      const { status } = req.body;
      const caregiverId = req.user.caregiverId;

      const alert = await EmergencyAlert.findById(alert_id);
      if (!alert) {
        return res.status(404).json({ message: "Alert not found" });
      }

      // التحقق من الصلاحيات
      const lovedOne = await LovedOne.findOne({
        _id: alert.loved_one,
        caregivers: caregiverId,
      });

      if (!lovedOne) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // تحديث أو إضافة إشعار
      let notification = alert.notifications_sent.find(
        (n) => n.caregiver.toString() === caregiverId
      );

      if (notification) {
        // تحديث الإشعار الموجود
        notification.status = status;
      } else if (caregiverId !== alert.requester.toString()) {
        // إضافة إشعار جديد لمقدم الرعاية
        alert.notifications_sent.push({
          caregiver: caregiverId,
          sent_at: new Date(),
          status: status,
        });
      }

      await alert.save();

      // تسجيل النشاط
      await new ActivityLog({
        description: `Emergency alert notification status updated to ${status}`,
        caregiver: caregiverId,
        action_type: "EMERGENCY_ALERT",
        metadata: new Map([
          ["alert_id", alert_id],
          ["notification_status", status],
        ]),
      }).save();

      res.json(alert);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = emergencyAlertController;
