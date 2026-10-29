import { appendFileSync, readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// On Vercel / serverless environments, only /tmp is writable
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const LOG_DIR = isServerless ? "/tmp/logs" : join(__dirname, "..", "logs");
const LOG_FILE = join(LOG_DIR, "activity.jsonl");
const CSV_FILE = join(LOG_DIR, "activity.csv");

function ensureLogDir() {
  try {
    if (!existsSync(LOG_DIR)) {
      mkdirSync(LOG_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn("Could not create log directory:", err.message);
  }
}

ensureLogDir();

export function logActivity(action, data, ip) {
  const entry = {
    timestamp: new Date().toISOString(),
    action,
    // Task fields
    taskId: data?.id ?? data?._id ?? null,
    taskTitle: data?.title ?? null,
    taskStatus: data?.status ?? null,
    taskPriority: data?.priority ?? null,
    // Auth fields
    email: data?.email ?? null,
    authMethod: data?.authMethod ?? null,
    googleId: data?.googleId ?? null,
    ip: ip ?? "127.0.0.1",
  };

  try {
    ensureLogDir();
    appendFileSync(LOG_FILE, JSON.stringify(entry) + "\n", "utf-8");
  } catch (err) {
    console.warn("Activity logger write error (handled gracefully):", err.message);
  }
}

export function getLogs() {
  try {
    if (!existsSync(LOG_FILE)) return [];
    const raw = readFileSync(LOG_FILE, "utf-8").trim();
    if (!raw) return [];
    return raw.split("\n").map((line) => JSON.parse(line)).reverse();
  } catch {
    return [];
  }
}

function escapeCSV(val) {
  const str = String(val ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportLogsAsCSV() {
  const logs = getLogs();
  const headers = ["Timestamp", "Action", "Task ID", "Task Title", "Status", "Priority", "Email", "Auth Method", "Google ID", "IP Address"];
  const rows = logs.map((log) =>
    [
      log.timestamp,
      log.action,
      log.taskId,
      log.taskTitle,
      log.taskStatus,
      log.taskPriority,
      log.email,
      log.authMethod,
      log.googleId,
      log.ip,
    ].map(escapeCSV).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

export function writeCSVFile() {
  try {
    ensureLogDir();
    const csv = exportLogsAsCSV();
    writeFileSync(CSV_FILE, csv, "utf-8");
    return CSV_FILE;
  } catch (err) {
    console.warn("CSV write error (handled gracefully):", err.message);
    return null;
  }
}
