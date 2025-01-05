const CalendarSync = require("../models/CalendarSync");
const Task = require("../models/Task");
const MedicationSchedule = require("../models/MedicationSchedule");
const icalGenerator = require("ical-generator");
const Appointment = require("../models/Appointment");
const Medication = require("../models/Medication");

const calendarController = {
  syncSettings: async (req, res) => {
    try {
      const {
        calendar_type,
        sync_direction,
        external_calendar_id,
        sync_preferences,
      } = req.body;
      const caregiverId = req.user.caregiverId;

      let calendarSync = await CalendarSync.findOne({ caregiver: caregiverId });

      if (calendarSync) {
        calendarSync.calendar_type = calendar_type;
        calendarSync.sync_direction = sync_direction;
        calendarSync.external_calendar_id = external_calendar_id;
        calendarSync.sync_preferences = sync_preferences;
      } else {
        calendarSync = new CalendarSync({
          caregiver: caregiverId,
          calendar_type,
          sync_direction,
          external_calendar_id,
          sync_preferences,
        });
      }

      await calendarSync.save();
      res.json(calendarSync);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  syncCalendar: async (req, res) => {
    try {
      const caregiverId = req.user.caregiverId;
      const calendarSync = await CalendarSync.findOne({
        caregiver: caregiverId,
      });

      if (!calendarSync) {
        return res
          .status(404)
          .json({ message: "لم يتم العثور على إعدادات المزامنة" });
      }

      // TODO: تنفيذ المزامنة مع التقويم الخارجي
      res.json({ message: "سيتم تنفيذ المزامنة قريباً" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getUpcomingEvents: async (req, res) => {
    try {
      const caregiverId = req.user.caregiverId;
      const { startDate, endDate } = req.query;

      const query = {
        assigned_to: caregiverId,
      };

      if (startDate && endDate) {
        query.due_date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      const tasks = await Task.find(query).sort({ due_date: 1 });
      const medications = await MedicationSchedule.find({
        ...query,
        schedule_time: query.due_date,
      }).sort({ schedule_time: 1 });

      res.json({
        tasks,
        medications,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  generateCalendar: async (req, res) => {
    try {
      const { loved_one_id } = req.params;
      const caregiverId = req.user.caregiverId;

      const calendarSync = await CalendarSync.findOne({
        caregiver: caregiverId,
      });

      const calendar = icalGenerator.default({
        name: "CareLink Calendar",
        timezone: "Asia/Riyadh",
        prodId: "//CareLink//Calendar//AR",
      });

      // إضافة المواعيد
      if (!calendarSync || calendarSync.sync_preferences.appointments) {
        const appointments = await Appointment.find({
          loved_one: loved_one_id,
          start_time: { $gte: new Date() },
        }).populate("loved_one", "name");

        appointments.forEach((appointment) => {
          calendar.createEvent({
            start: appointment.start_time,
            end: appointment.end_time,
            summary: `🏥 ${appointment.title}`,
            description: `${appointment.description}\n\nالمريض: ${appointment.loved_one.name}`,
            location: appointment.location,
            url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              appointment.location
            )}`,
            organizer: {
              name: "CareLink",
              email: "noreply@carelink.com",
            },
            busyStatus: "BUSY",
            duration: { hours: 1 }, // مدة افتراضية ساعة واحدة
          });
        });
      }

      // إضافة الأدوية
      if (!calendarSync || calendarSync.sync_preferences.medications) {
        const medications = await Medication.find({
          loved_one: loved_one_id,
          status: "ACTIVE",
        }).populate("loved_one", "name");

        medications.forEach((medication) => {
          medication.times.forEach((time) => {
            const [hour, minute] = time.split(":");
            const startDate = new Date(medication.start_date);
            startDate.setHours(parseInt(hour), parseInt(minute), 0);

            calendar.createEvent({
              start: startDate,
              summary: `💊 ${medication.name}`,
              description:
                `الجرعة: ${medication.dosage}\n` +
                `التعليمات: ${medication.instructions}\n` +
                `الغرض: ${medication.purpose || "غير محدد"}\n\n` +
                `المريض: ${medication.loved_one.name}\n` +
                `تكرار: ${
                  medication.frequency === "DAILY"
                    ? "يومياً"
                    : medication.frequency === "WEEKLY"
                    ? "أسبوعياً"
                    : medication.frequency === "MONTHLY"
                    ? "شهرياً"
                    : "غير محدد"
                }`,
              repeating: {
                freq: medication.frequency.toLowerCase(),
                until: medication.end_date,
              },
              alarms: [
                { type: "display", trigger: 900 }, // 15 دقيقة
                { type: "display", trigger: 3600 }, // ساعة
                { type: "email", trigger: 7200 }, // ساعتين (بريد إلكتروني)
              ],
              busyStatus: "FREE",
              duration: { minutes: 15 }, // مدة افتراضية 15 دقيقة
            });
          });
        });
      }

      // إضافة المهام
      if (!calendarSync || calendarSync.sync_preferences.tasks) {
        const tasks = await Task.find({
          loved_one: loved_one_id,
          status: { $ne: "COMPLETED" },
          due_date: { $gte: new Date() },
        }).populate("loved_one", "name");

        tasks.forEach((task) => {
          const event = calendar.createEvent({
            start: task.due_date,
            summary: `📋 ${task.title}`,
            description:
              `${task.description}\n\n` +
              `الأولوية: ${
                task.priority === "HIGH"
                  ? "⚠️ عالية"
                  : task.priority === "MEDIUM"
                  ? "⚡ متوسطة"
                  : "🔵 منخفضة"
              }\n` +
              `الفئة: ${task.category}\n` +
              `المريض: ${task.loved_one.name}\n\n` +
              (task.recurring?.is_recurring
                ? `تكرار: ${
                    task.recurring.frequency === "DAILY"
                      ? "يومياً"
                      : task.recurring.frequency === "WEEKLY"
                      ? "أسبوعياً"
                      : "شهرياً"
                  }\n` +
                  `أيام: ${task.recurring.days
                    .map((day) =>
                      day === "sunday"
                        ? "الأحد"
                        : day === "monday"
                        ? "الاثنين"
                        : day === "tuesday"
                        ? "الثلاثاء"
                        : day === "wednesday"
                        ? "الأربعاء"
                        : day === "thursday"
                        ? "الخميس"
                        : day === "friday"
                        ? "الجمعة"
                        : "السبت"
                    )
                    .join(", ")}`
                : ""),
            busyStatus: task.priority === "HIGH" ? "BUSY" : "FREE",
            duration: { hours: 1 }, // مدة افتراضية ساعة واحدة
          });

          if (task.recurring?.is_recurring) {
            event.repeating({
              freq: task.recurring.frequency.toLowerCase(),
              byDay: task.recurring.days.map((day) =>
                day.substring(0, 2).toUpperCase()
              ),
            });
          }

          // تنبيهات متعددة للمهام عالية الأولوية
          if (task.priority === "HIGH") {
            event.createAlarm({
              type: "display",
              trigger: 3600, // ساعة
            });
            event.createAlarm({
              type: "display",
              trigger: 7200, // ساعتين
            });
          } else {
            event.createAlarm({
              type: "display",
              trigger: 3600, // ساعة
            });
          }
        });
      }

      res.set("Content-Type", "text/calendar; charset=utf-8");
      res.set(
        "Content-Disposition",
        "attachment; filename=carelink-calendar.ics"
      );
      res.send(calendar.toString());
    } catch (error) {
      console.error("Calendar generation error:", error);
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = calendarController;
