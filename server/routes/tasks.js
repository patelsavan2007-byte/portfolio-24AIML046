import { Router } from "express";
import { Task, validateTaskBody } from "../models/taskModel.js";
import { logActivity } from "../middleware/activityLogger.js";

const router = Router();
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

// GET /api/tasks - list all tasks with pagination
router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = 5;
    const totalItems = await Task.countDocuments();
    const totalPages = Math.max(Math.ceil(totalItems / limit), 1);
    const normalizedPage = Math.min(page, totalPages);
    const tasks = await Task.find()
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
});

// GET /api/tasks/:id - get single task
router.get("/:id", async (req, res, next) => {
  const { id } = req.params;
  if (!objectIdRegex.test(id)) {
    return res.status(400).json({ error: { message: "Task ID must be a valid MongoDB ObjectId.", status: 400 } });
  }

  try {
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ error: { message: `Task with id ${id} not found.`, status: 404 } });
    }
    res.status(200).json({ task });
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks - create a task
router.post("/", async (req, res, next) => {
  const errors = validateTaskBody(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: { message: errors.join(" "), status: 400 } });
  }

  try {
    const task = await Task.create(req.body);
    logActivity("CREATE", task, req.ip);
    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
});

// PUT /api/tasks/:id - full update
router.put("/:id", async (req, res, next) => {
  const { id } = req.params;
  if (!objectIdRegex.test(id)) {
    return res.status(400).json({ error: { message: "Task ID must be a valid MongoDB ObjectId.", status: 400 } });
  }

  const errors = validateTaskBody(req.body, true);
  if (errors.length > 0) {
    return res.status(400).json({ error: { message: errors.join(" "), status: 400 } });
  }

  try {
    const task = await Task.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
      context: "query",
    });

    if (!task) {
      return res.status(404).json({ error: { message: `Task with id ${id} not found.`, status: 404 } });
    }

    logActivity("UPDATE", task, req.ip);
    res.status(200).json({ task });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tasks/:id - partial update
router.patch("/:id", async (req, res, next) => {
  const { id } = req.params;
  if (!objectIdRegex.test(id)) {
    return res.status(400).json({ error: { message: "Task ID must be a valid MongoDB ObjectId.", status: 400 } });
  }

  const errors = validateTaskBody(req.body, true);
  if (errors.length > 0) {
    return res.status(400).json({ error: { message: errors.join(" "), status: 400 } });
  }

  try {
    const task = await Task.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
      context: "query",
    });

    if (!task) {
      return res.status(404).json({ error: { message: `Task with id ${id} not found.`, status: 404 } });
    }

    logActivity("UPDATE", task, req.ip);
    res.status(200).json({ task });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/:id - delete a task
router.delete("/:id", async (req, res, next) => {
  const { id } = req.params;
  if (!objectIdRegex.test(id)) {
    return res.status(400).json({ error: { message: "Task ID must be a valid MongoDB ObjectId.", status: 400 } });
  }

  try {
    const task = await Task.findByIdAndDelete(id);
    if (!task) {
      return res.status(404).json({ error: { message: `Task with id ${id} not found.`, status: 404 } });
    }

    logActivity("DELETE", task, req.ip);
    res.status(200).json({ message: `Task '${task.title}' deleted successfully.`, task });
  } catch (err) {
    next(err);
  }
});

export default router;
