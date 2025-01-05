const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const routes = require("./routes");
const errorHandler = require("./middleware/errorHandler");
const dbConfig = require("./config/database");
const taskRoutes = require("./routes/taskRoutes");
const carePlanRoutes = require("./routes/carePlanRoutes");
const medicationRoutes = require("./routes/medicationRoutes");
const dailyNoteRoutes = require("./routes/dailyNoteRoutes");
const medicalHistoryRoutes = require("./routes/medicalHistoryRoutes");
const emergencyAlertRoutes = require("./routes/emergencyAlertRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const calendarSyncRoutes = require("./routes/calendarSyncRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api", routes);
app.use("/api/tasks", taskRoutes);
app.use("/api/care-plans", carePlanRoutes);
app.use("/api/medications", medicationRoutes);
app.use("/api/daily-notes", dailyNoteRoutes);
app.use("/api/medical-history", medicalHistoryRoutes);
app.use("/api/emergency-alerts", emergencyAlertRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/calendar-sync", calendarSyncRoutes);

// Error Handler
app.use(errorHandler);

// Database Connection
console.log("MongoDB URI:", process.env.MONGODB_URI);
mongoose
  .connect(dbConfig.url, dbConfig.options)
  .then(() => {
    console.log("Successfully connected to database");
  })
  .catch((err) => {
    console.error("Database connection error:", err.message);
  });

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
