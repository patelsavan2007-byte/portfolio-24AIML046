import dotenv from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import requestLogger from "./middleware/logger.js";
import errorHandler from "./middleware/errorHandler.js";
import { getLogs, exportLogsAsCSV } from "./middleware/activityLogger.js";
import authRoutes from "./routes/auth.js";
import taskRoutes from "./routes/tasks.js";
import aiRoutes from "./routes/ai.js";
// Practical 10: Register EventEmitter listeners at application startup
import "./listeners.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env") });
dotenv.config({ path: resolve(__dirname, ".env") });

const app = express();
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

// Built-in middleware
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? CLIENT_ORIGIN
        : ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Custom logging middleware
app.use(requestLogger);

// Mount task and auth routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
// Practical 12: Mount on /tasks as well to support direct /tasks test calls
app.use("/tasks", taskRoutes);
// Practical 13: Mount AI routes for intelligent task descriptions
app.use("/api/ai", aiRoutes);
app.use("/ai", aiRoutes);

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
    error: {
      message: `Route ${req.method} ${req.originalUrl} not found.`,
      status: 404,
    },
  });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
