import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import requestLogger from "./server/middleware/logger.js";
import errorHandler from "./server/middleware/errorHandler.js";
import { getLogs, exportLogsAsCSV } from "./server/middleware/activityLogger.js";
import taskRoutes from "./server/routes/tasks.js";
import { connectDB } from "./server/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Built-in middleware
app.use(cors());
app.use(express.json());

// Custom logging middleware
app.use(requestLogger);

// Routes
app.use("/api/tasks", taskRoutes);

// GET /api/logs - read activity log (newest first)
app.get("/api/logs", (req, res) => {
  res.status(200).json({ logs: getLogs() });
});

// GET /api/logs/csv - download activity log as CSV
app.get("/api/logs/csv", (req, res) => {
  const csv = exportLogsAsCSV();
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=activity_log.csv");
  res.status(200).send(csv);
});

// Root health check
app.get("/", (req, res) => {
  res.status(200).json({ message: "Task Management API is running." });
});

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    error: { message: `Route ${req.method} ${req.originalUrl} not found.`, status: 404 },
  });
});

// Global error handler (must be last)
app.use(errorHandler);

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Task Management API server listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server failed to start due to database connection error.");
    process.exit(1);
  }
}

startServer();

export default app;
