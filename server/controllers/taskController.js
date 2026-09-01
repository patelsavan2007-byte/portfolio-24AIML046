import mongoose from "mongoose";
import { Task, validateTaskBody } from "../models/taskModel.js";
import { logActivity } from "../middleware/activityLogger.js";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

// In-memory store fallback when MongoDB is not connected
let memoryTasks = [
  {
    id: "650000000000000000000001",
    title: "Sample Task (Memory Mode)",
    description: "Database is not connected. Whitelist your IP in MongoDB Atlas to enable persistence.",
    completed: false,
    status: "pending",
    priority: "medium",
    userId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function isDBConnected() {
  return mongoose.connection.readyState === 1;
}

function isValidObjectId(id) {
  return objectIdRegex.test(id);
}

export async function listTasks(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const status = req.query.status;
    const limit = 5;
    const userId = req.user.userId;

    if (!isDBConnected()) {
      const userTasks = memoryTasks.filter((t) => t.userId === userId);
      const totalItems = userTasks.length;
      const totalPages = Math.max(Math.ceil(totalItems / limit), 1);
      const normalizedPage = Math.min(page, totalPages);
      const tasks = userTasks.slice((normalizedPage - 1) * limit, normalizedPage * limit);

      return res.status(200).json({
        data: tasks,
        currentPage: normalizedPage,
        totalPages,
        totalItems,
        dbStatus: "disconnected",
        warning: "MongoDB is not connected.",
      });
    }

    const query = { userId };
    if (status && ["pending", "in-progress", "completed"].includes(status)) {
      query.status = status;
    }

    const totalItems = await Task.countDocuments(query);
    const totalPages = Math.max(Math.ceil(totalItems / limit), 1);
    const normalizedPage = Math.min(page, totalPages);
    const tasks = await Task.find(query)
      .sort({ createdAt: -1 })
      .skip((normalizedPage - 1) * limit)
      .limit(limit);

    res.status(200).json({
      data: tasks,
      currentPage: normalizedPage,
      totalPages,
      totalItems,
    });
  } catch (err) {
    next(err);
  }
}

export async function getTask(req, res, next) {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({
      error: { message: "Task ID must be a valid MongoDB ObjectId.", status: 400 },
    });
  }

  try {
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        error: { message: `Task with id ${id} not found.`, status: 404 },
      });
    }

    if (task.userId && task.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        error: { message: "You do not have permission to view this task.", status: 403 },
      });
    }

    res.status(200).json({ task });
  } catch (err) {
    next(err);
  }
}

export async function createTask(req, res, next) {
  const errors = validateTaskBody(req.body);
  if (errors.length > 0) {
    return res.status(400).json({
      error: { message: errors.join(" "), status: 400 },
    });
  }

  try {
    const taskData = { ...req.body };
    if (req.user) {
      taskData.userId = req.user.userId;
    }

    const task = await Task.create(taskData);
    logActivity("CREATE", task, req.ip);

    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
}

async function updateTaskById(id, body, req, res, next) {
  if (!isValidObjectId(id)) {
    return res.status(400).json({
      error: { message: "Task ID must be a valid MongoDB ObjectId.", status: 400 },
    });
  }

  const errors = validateTaskBody(body, true);
  if (errors.length > 0) {
    return res.status(400).json({
      error: { message: errors.join(" "), status: 400 },
    });
  }

  try {
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        error: { message: `Task with id ${id} not found.`, status: 404 },
      });
    }

    if (task.userId && task.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        error: { message: "You do not have permission to update this task.", status: 403 },
      });
    }

    Object.assign(task, body);
    await task.save();

    logActivity("UPDATE", task, req.ip);
    res.status(200).json({ task });
  } catch (err) {
    next(err);
  }
}

export async function updateTask(req, res, next) {
  await updateTaskById(req.params.id, req.body, req, res, next);
}

export async function patchTask(req, res, next) {
  await updateTaskById(req.params.id, req.body, req, res, next);
}

export async function deleteTask(req, res, next) {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({
      error: { message: "Task ID must be a valid MongoDB ObjectId.", status: 400 },
    });
  }

  try {
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        error: { message: `Task with id ${id} not found.`, status: 404 },
      });
    }

    if (task.userId && task.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        error: { message: "You do not have permission to delete this task.", status: 403 },
      });
    }

    await Task.findByIdAndDelete(id);

    logActivity("DELETE", task, req.ip);
    res.status(200).json({
      message: `Task '${task.title}' deleted successfully.`,
      task,
    });
  } catch (err) {
    next(err);
  }
}
