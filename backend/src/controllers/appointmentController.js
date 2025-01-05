const Appointment = require("../models/Appointment");
const LovedOne = require("../models/LovedOne");
const ActivityLog = require("../models/ActivityLog");

const appointmentController = {
  // إنشاء موعد جديد
  create: async (req, res) => {
    try {
      const { loved_one_id } = req.params;
      const {
        title,
        type,
        start_time,
        end_time,
        location,
        description,
        attendees,
        reminders,
        recurring,
        recurring_pattern,
        notes,
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

      // إنشاء الموعد
      const appointment = new Appointment({
        loved_one: loved_one_id,
        title,
        type,
        start_time,
        end_time,
        location,
        description,
        attendees: attendees || [],
        reminders: reminders || [],
        recurring,
        recurring_pattern,
        notes,
        created_by: caregiverId,
      });

      await appointment.save();

      // تسجيل النشاط
      await new ActivityLog({
        description: `Appointment created: ${title}`,
        caregiver: caregiverId,
        action_type: "APPOINTMENT_CREATE",
        metadata: new Map([
          ["appointment_id", appointment._id.toString()],
          ["loved_one_id", loved_one_id],
        ]),
      }).save();

      res.status(201).json(appointment);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // تحديث موعد
  update: async (req, res) => {
    try {
      const { appointment_id } = req.params;
      const updates = req.body;
      const caregiverId = req.user.caregiverId;

      const appointment = await Appointment.findById(appointment_id);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      // التحقق من الصلاحيات
      const lovedOne = await LovedOne.findOne({
        _id: appointment.loved_one,
        caregivers: caregiverId,
      });

      if (!lovedOne) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // تحديث الموعد
      Object.assign(appointment, updates);
      await appointment.save();

      // تسجيل النشاط
      await new ActivityLog({
        description: `Appointment updated: ${appointment.title}`,
        caregiver: caregiverId,
        action_type: "APPOINTMENT_UPDATE",
        metadata: new Map([
          ["appointment_id", appointment_id],
          ["updates", JSON.stringify(updates)],
        ]),
      }).save();

      res.json(appointment);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // حذف موعد
  delete: async (req, res) => {
    try {
      const { appointment_id } = req.params;
      const caregiverId = req.user.caregiverId;

      const appointment = await Appointment.findById(appointment_id);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      // التحقق من الصلاحيات
      const lovedOne = await LovedOne.findOne({
        _id: appointment.loved_one,
        caregivers: caregiverId,
      });

      if (!lovedOne) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // حذف الموعد باستخدام deleteOne
      await Appointment.deleteOne({ _id: appointment_id });

      // تسجيل النشاط
      await new ActivityLog({
        description: `Appointment deleted: ${appointment.title}`,
        caregiver: caregiverId,
        action_type: "APPOINTMENT_DELETE",
        metadata: new Map([["appointment_id", appointment_id]]),
      }).save();

      res.json({ message: "Appointment deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // جلب مواعيد شخص محتاج للرعاية
  getByLovedOne: async (req, res) => {
    try {
      const { loved_one_id } = req.params;
      const { start_date, end_date, status, type } = req.query;
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

      if (start_date && end_date) {
        query.start_time = {
          $gte: new Date(start_date),
          $lte: new Date(end_date),
        };
      }

      if (status) {
        query.status = status;
      }

      if (type) {
        query.type = type;
      }

      const appointments = await Appointment.find(query)
        .populate("created_by", "name email phone_number")
        .populate("attendees.caregiver", "name email phone_number")
        .populate("loved_one", "name")
        .sort({ start_time: 1 });

      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = appointmentController;
