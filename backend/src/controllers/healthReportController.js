const HealthReport = require("../models/HealthReport");
const Medication = require("../models/Medication");
const Appointment = require("../models/Appointment");
const DailyNote = require("../models/DailyNote");
const Task = require("../models/Task");
const EmergencyAlert = require("../models/EmergencyAlert");
const ActivityLog = require("../models/ActivityLog");

const healthReportController = {
  // إنشاء تقرير جديد
  generateReport: async (req, res) => {
    try {
      const { loved_one_id, report_type, start_date, end_date } = req.body;
      const caregiverId = req.user.caregiverId;

      // جمع البيانات للفترة المحددة
      const dateRange = {
        $gte: new Date(start_date),
        $lte: new Date(end_date),
      };

      // جمع بيانات الأدوية
      const medications = await Medication.find({
        loved_one: loved_one_id,
        start_date: dateRange,
      });

      // جمع بيانات المواعيد
      const appointments = await Appointment.find({
        loved_one: loved_one_id,
        start_time: dateRange,
      });

      // جمع الملاحظات اليومية
      const dailyNotes = await DailyNote.find({
        loved_one: loved_one_id,
        date: dateRange,
      });

      // جمع المهام
      const tasks = await Task.find({
        loved_one: loved_one_id,
        due_date: dateRange,
      });

      // جمع حالات الطوارئ
      const emergencyAlerts = await EmergencyAlert.find({
        loved_one: loved_one_id,
        created_at: dateRange,
      });

      // حساب الإحصائيات
      const completedTasks = tasks.filter(
        (task) => task.status === "COMPLETED"
      ).length;
      const missedAppointments = appointments.filter(
        (apt) => apt.status === "MISSED"
      ).length;

      // إنشاء التقرير
      const report = new HealthReport({
        loved_one: loved_one_id,
        generated_by: caregiverId,
        report_type,
        date_range: {
          start: start_date,
          end: end_date,
        },
        data: {
          medications: medications.map((m) => m._id),
          appointments: appointments.map((a) => a._id),
          daily_notes: dailyNotes.map((n) => n._id),
          tasks: tasks.map((t) => t._id),
          emergency_alerts: emergencyAlerts.map((e) => e._id),
        },
        summary: {
          medications_adherence: calculateMedicationAdherence(medications),
          completed_tasks: completedTasks,
          missed_appointments: missedAppointments,
          emergency_count: emergencyAlerts.length,
        },
      });

      await report.save();

      // تسجيل النشاط
      await new ActivityLog({
        description: `تم إنشاء تقرير صحي ${report_type}`,
        caregiver: caregiverId,
        action_type: "HEALTH_REPORT_GENERATE",
      }).save();

      res.status(201).json(report);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // تصدير التقرير
  exportReport: async (req, res) => {
    try {
      const { report_id, format } = req.params;
      const report = await HealthReport.findById(report_id)
        .populate("data.medications")
        .populate("data.appointments")
        .populate("data.daily_notes")
        .populate("data.tasks")
        .populate("data.emergency_alerts")
        .populate("loved_one", "name")
        .populate("generated_by", "name");

      if (!report) {
        return res.status(404).json({ message: "التقرير غير موجود" });
      }

      // تنسيق البيانات حسب الصيغة المطلوبة
      let exportedData;
      switch (format) {
        case "PDF":
          exportedData = await generatePDFReport(report);
          break;
        case "EXCEL":
          exportedData = await generateExcelReport(report);
          break;
        case "JSON":
          exportedData = report.toJSON();
          break;
        default:
          return res.status(400).json({ message: "صيغة غير مدعومة" });
      }

      // تحديث حالة التقرير
      report.status = "EXPORTED";
      report.export_format = format;
      await report.save();

      res.json({
        message: "تم تصدير التقرير بنجاح",
        data: exportedData,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

// دالة مساعدة لحساب نسبة الالتزام بالأدوية
function calculateMedicationAdherence(medications) {
  // حساب نسبة الالتزام بناءً على سجلات تناول الدواء
  return 0; // TODO: تنفيذ الحساب الفعلي
}

module.exports = healthReportController;
