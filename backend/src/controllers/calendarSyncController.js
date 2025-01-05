const CalendarSync = require("../models/CalendarSync");
const { google } = require("googleapis");
const ActivityLog = require("../models/ActivityLog");
const Appointment = require("../models/Appointment");

const calendarSyncController = {
  // الحصول على رابط المصادقة
  getAuthUrl: async (req, res) => {
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      const scopes = [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events",
      ];

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: scopes,
        prompt: "consent",
      });

      res.json({ auth_url: authUrl });
    } catch (error) {
      console.error("Auth URL Error:", error);
      res.status(500).json({ message: error.message });
    }
  },

  // معالجة callback من Google
  handleCallback: async (req, res) => {
    try {
      const { code } = req.query;
      const caregiverId = req.user.caregiverId;

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      const { tokens } = await oauth2Client.getToken(code);
      console.log("Received tokens:", tokens);

      const calendarSync = new CalendarSync({
        caregiver: caregiverId,
        provider: "GOOGLE",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires: new Date(tokens.expiry_date),
      });

      await calendarSync.save();

      await new ActivityLog({
        description: "Google Calendar connected",
        caregiver: caregiverId,
        action_type: "CALENDAR_SYNC_CONNECT",
      }).save();

      res.json({
        message: "Google Calendar connected successfully",
        provider: "GOOGLE",
      });
    } catch (error) {
      console.error("Callback Error:", error);
      res.status(500).json({
        message: error.message,
        details: error.response?.data || "No additional details",
      });
    }
  },

  // تحديث إعدادات المزامنة
  updateSyncSettings: async (req, res) => {
    try {
      const { sync_preferences, sync_direction, sync_enabled } = req.body;
      const caregiverId = req.user.caregiverId;

      const calendarSync = await CalendarSync.findOneAndUpdate(
        { caregiver: caregiverId },
        { sync_preferences, sync_direction, sync_enabled },
        { new: true }
      );

      if (!calendarSync) {
        return res.status(404).json({ message: "Calendar sync not found" });
      }

      res.json(calendarSync);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // مزامنة المواعيد مع Google Calendar
  syncAppointments: async (req, res) => {
    try {
      const caregiverId = req.user.caregiverId;
      const { loved_one_id } = req.params;

      // التحقق من وجود مزامنة نشطة
      const calendarSync = await CalendarSync.findOne({
        caregiver: caregiverId,
        sync_enabled: true,
        "sync_preferences.appointments": true,
      });

      if (!calendarSync) {
        return res
          .status(404)
          .json({ message: "Active calendar sync not found" });
      }

      // جلب المواعيد من قاعدة البيانات
      const appointments = await Appointment.find({
        loved_one: loved_one_id,
        start_time: { $gte: new Date() },
      }).populate("loved_one", "name");

      // إعداد Google Calendar API
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      oauth2Client.setCredentials({
        access_token: calendarSync.access_token,
        refresh_token: calendarSync.refresh_token,
      });

      const calendar = google.calendar({ version: "v3", auth: oauth2Client });

      // مزامنة كل موعد
      const syncResults = await Promise.all(
        appointments.map(async (appointment) => {
          try {
            const event = {
              summary: appointment.title,
              description: appointment.description,
              start: {
                dateTime: appointment.start_time,
                timeZone: "Asia/Riyadh",
              },
              end: {
                dateTime: appointment.end_time,
                timeZone: "Asia/Riyadh",
              },
              location: appointment.location,
              reminders: {
                useDefault: false,
                overrides: [
                  { method: "email", minutes: 24 * 60 },
                  { method: "popup", minutes: 30 },
                ],
              },
            };

            const result = await calendar.events.insert({
              calendarId: "primary",
              resource: event,
            });

            return {
              appointment_id: appointment._id,
              google_event_id: result.data.id,
              status: "synced",
            };
          } catch (error) {
            return {
              appointment_id: appointment._id,
              error: error.message,
              status: "failed",
            };
          }
        })
      );

      // تحديث آخر مزامنة
      calendarSync.last_sync = new Date();
      await calendarSync.save();

      // تسجيل النشاط
      await new ActivityLog({
        description: `Appointments synced with Google Calendar`,
        caregiver: caregiverId,
        action_type: "CALENDAR_SYNC_UPDATE",
        metadata: new Map([
          ["sync_type", "appointments"],
          ["appointments_count", appointments.length.toString()],
        ]),
      }).save();

      res.json({
        message: "Appointments synced successfully",
        results: syncResults,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = calendarSyncController;
