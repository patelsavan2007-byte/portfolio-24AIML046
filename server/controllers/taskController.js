import mongoose from "mongoose";
import { Task, validateTaskBody } from "../models/taskModel.js";
import { logActivity } from "../middleware/activityLogger.js";
import { cache } from "../utils/cache.js";
import taskEvents from "../events.js";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

// In-memory store fallback when MongoDB is not connected
let memoryTasks = [
  {
    id: "650000000000000000000001",
    _id: "650000000000000000000001",
    title: "Complete Practical 9 Caching Lab",
    description: "Implement in-memory caching with node-cache and benchmark response times.",
    completed: false,
    status: "in-progress",
    priority: "high",
    userId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "650000000000000000000002",
    _id: "650000000000000000000002",
    title: "Benchmark API Response Times",
    description: "Record 3 cached and 3 uncached response times using Postman or Thunder Client.",
    completed: true,
    status: "completed",
    priority: "medium",
    userId: null,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "650000000000000000000003",
    _id: "650000000000000000000003",
    title: "Test Cache Invalidation on Mutations",
    description: "Verify that POST/PUT/DELETE operations immediately purge stale cache keys.",
    completed: false,
    status: "pending",
    priority: "high",
    userId: null,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
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
  const startTime = performance.now();
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const status = req.query.status;
    const limit = 5;
    const userId = req.user?.userId || null;
    const bypassCache = req.query.noCache === "true" || req.headers["x-no-cache"] === "true";

    // Stable cache key for all tasks queries
    const isDefaultQuery = (!req.query.page || page === 1) && (!status || status === "all");
    const cacheKey = isDefaultQuery
      ? (userId ? `all_tasks_user_${userId}` : "all_tasks")
      : `tasks_${userId || "all"}_p${page}_s${status || "all"}`;

    // 1. Cache check (node-cache) - Step 3 from Practical 9 manual
    if (!bypassCache) {
      const cached = cache.get(cacheKey) || (isDefaultQuery && cache.get("all_tasks"));
      if (cached) {
        const durationMs = parseFloat((performance.now() - startTime).toFixed(2));
        res.setHeader("X-Cache", "HIT");
        res.setHeader("X-Response-Time", `${durationMs}ms`);
        res.setHeader("X-Cache-Key", cacheKey);
        return res.status(200).json({
          ...cached,
          cached: true,
          source: "node-cache (in-memory)",
          responseTimeMs: durationMs,
        });
      }
    }

    let payload;

    // Cache MISS: Query database or memory fallback
    if (!isDBConnected()) {
      let userTasks = userId ? memoryTasks.filter((t) => !t.userId || t.userId === userId) : memoryTasks;
      if (status && ["pending", "in-progress", "completed"].includes(status)) {
        userTasks = userTasks.filter((t) => t.status === status);
      }
      const totalItems = userTasks.length;
      const totalPages = Math.max(Math.ceil(totalItems / limit), 1);
      const normalizedPage = Math.min(page, totalPages);
      const tasks = userTasks.slice((normalizedPage - 1) * limit, normalizedPage * limit);

      payload = {
        data: tasks,
        currentPage: normalizedPage,
        totalPages,
        totalItems,
        dbStatus: "disconnected",
        warning: "MongoDB is not connected. Running in in-memory mode.",
        source: "in-memory-db",
      };
    } else {
      const query = userId ? { userId } : {};
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

      payload = {
        data: tasks,
        currentPage: normalizedPage,
        totalPages,
        totalItems,
        source: "mongodb",
      };
    }

    // Store in node-cache with 60s TTL
    if (!bypassCache) {
      cache.set(cacheKey, payload);
      if (isDefaultQuery) {
        cache.set("all_tasks", payload);
      }
    }

    const durationMs = parseFloat((performance.now() - startTime).toFixed(2));
    res.setHeader("X-Cache", bypassCache ? "BYPASS" : "MISS");
    res.setHeader("X-Response-Time", `${durationMs}ms`);
    res.setHeader("X-Cache-Key", cacheKey);

    return res.status(200).json({
      ...payload,
      cached: false,
      responseTimeMs: durationMs,
    });
  } catch (err) {
    next(err);
  }
}

export async function getTask(req, res, next) {
  const startTime = performance.now();
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({
      error: { message: "Task ID must be a valid MongoDB ObjectId.", status: 400 },
    });
  }

  const bypassCache = req.query.noCache === "true" || req.headers["x-no-cache"] === "true";
  const singleCacheKey = `task_${id}`;

  // Supplementary: Cache GET /tasks/:id single-task endpoint separately
  if (!bypassCache) {
    const cachedTask = cache.get(singleCacheKey);
    if (cachedTask) {
      const durationMs = parseFloat((performance.now() - startTime).toFixed(2));
      res.setHeader("X-Cache", "HIT");
      res.setHeader("X-Response-Time", `${durationMs}ms`);
      res.setHeader("X-Cache-Key", singleCacheKey);
      return res.status(200).json({
        ...cachedTask,
        cached: true,
        source: "node-cache (in-memory)",
        responseTimeMs: durationMs,
      });
    }
  }

  if (!isDBConnected()) {
    const task = memoryTasks.find((t) => t.id === id || t._id === id);
    if (!task) {
      return res.status(404).json({
        error: { message: `Task with id ${id} not found.`, status: 404 },
      });
    }
    if (task.userId && req.user && task.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        error: { message: "You do not have permission to view this task.", status: 403 },
      });
    }

    if (!bypassCache) {
      cache.set(singleCacheKey, { task });
    }

    const durationMs = parseFloat((performance.now() - startTime).toFixed(2));
    res.setHeader("X-Cache", bypassCache ? "BYPASS" : "MISS");
    res.setHeader("X-Response-Time", `${durationMs}ms`);
    res.setHeader("X-Cache-Key", singleCacheKey);
    return res.status(200).json({ task, cached: false, responseTimeMs: durationMs });
  }

  try {
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        error: { message: `Task with id ${id} not found.`, status: 404 },
      });
    }

    if (task.userId && req.user && task.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        error: { message: "You do not have permission to view this task.", status: 403 },
      });
    }

    if (!bypassCache) {
      cache.set(singleCacheKey, { task });
    }

    const durationMs = parseFloat((performance.now() - startTime).toFixed(2));
    res.setHeader("X-Cache", bypassCache ? "BYPASS" : "MISS");
    res.setHeader("X-Response-Time", `${durationMs}ms`);
    res.setHeader("X-Cache-Key", singleCacheKey);
    res.status(200).json({ task, cached: false, responseTimeMs: durationMs });
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

    if (!isDBConnected()) {
      const generatedId = new mongoose.Types.ObjectId().toString();
      const newTask = {
        _id: generatedId,
        id: generatedId,
        title: taskData.title,
        description: taskData.description || "",
        status: taskData.status || "pending",
        priority: taskData.priority || "medium",
        completed: taskData.status === "completed",
        userId: taskData.userId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memoryTasks.unshift(newTask);
      logActivity("CREATE", newTask, req.ip);

      // Step 4: Invalidate cache after successful POST write
      cache.invalidateTasksCache();
      console.log("[node-cache] Invalidated task caches following POST /tasks");

      // Practical 10: Log API response timestamp and send 201 response BEFORE emitting event
      console.log(`[API] Response sent at ${new Date().toISOString()}`);
      res.status(201).json(newTask);

      // Emit event asynchronously AFTER response is sent (non-blocking)
      taskEvents.emit("task-created", newTask);
      return;
    }

    const task = await Task.create(taskData);
    logActivity("CREATE", task, req.ip);

    // Step 4: Invalidate cache after successful POST write
    cache.invalidateTasksCache();
    console.log("[node-cache] Invalidated task caches following POST /tasks");

    // Practical 10: Log API response timestamp and send 201 response BEFORE emitting event
    console.log(`[API] Response sent at ${new Date().toISOString()}`);
    res.status(201).json(task);

    // Emit event asynchronously AFTER response is sent (non-blocking)
    taskEvents.emit("task-created", task);
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

  if (!isDBConnected()) {
    const taskIndex = memoryTasks.findIndex((t) => t.id === id || t._id === id);
    if (taskIndex === -1) {
      return res.status(404).json({
        error: { message: `Task with id ${id} not found.`, status: 404 },
      });
    }
    const task = memoryTasks[taskIndex];
    if (task.userId && req.user && task.userId !== req.user.userId) {
      return res.status(403).json({
        error: { message: "You do not have permission to update this task.", status: 403 },
      });
    }
    Object.assign(task, body, { updatedAt: new Date().toISOString() });
    if (body.status) {
      task.completed = body.status === "completed";
    }
    memoryTasks[taskIndex] = task;
    logActivity("UPDATE", task, req.ip);

    // Step 4: Invalidate all tasks & single task cache after successful PUT/PATCH write
    cache.invalidateTasksCache(id);
    console.log(`[node-cache] Invalidated task caches following PUT/PATCH /tasks/${id}`);

    return res.status(200).json({ task });
  }

  try {
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        error: { message: `Task with id ${id} not found.`, status: 404 },
      });
    }

    if (task.userId && req.user && task.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        error: { message: "You do not have permission to update this task.", status: 403 },
      });
    }

    Object.assign(task, body);
    await task.save();

    logActivity("UPDATE", task, req.ip);

    // Step 4: Invalidate all tasks & single task cache after successful PUT/PATCH write
    cache.invalidateTasksCache(id);
    console.log(`[node-cache] Invalidated task caches following PUT/PATCH /tasks/${id}`);

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

  if (!isDBConnected()) {
    const taskIndex = memoryTasks.findIndex((t) => t.id === id || t._id === id);
    if (taskIndex === -1) {
      return res.status(404).json({
        error: { message: `Task with id ${id} not found.`, status: 404 },
      });
    }
    const task = memoryTasks[taskIndex];
    if (task.userId && req.user && task.userId !== req.user.userId) {
      return res.status(403).json({
        error: { message: "You do not have permission to delete this task.", status: 403 },
      });
    }
    memoryTasks.splice(taskIndex, 1);
    logActivity("DELETE", task, req.ip);

    // Step 4: Invalidate cache after successful DELETE write
    cache.invalidateTasksCache(id);
    console.log(`[node-cache] Invalidated task caches following DELETE /tasks/${id}`);

    // Practical 10: Log API response timestamp and send 200 response BEFORE emitting event
    console.log(`[API] Response sent at ${new Date().toISOString()}`);
    res.status(200).json({
      message: `Task '${task.title}' deleted successfully.`,
      task,
    });

    // Emit event asynchronously AFTER response is sent (non-blocking)
    taskEvents.emit("task-deleted", task);
    return;
  }

  try {
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        error: { message: `Task with id ${id} not found.`, status: 404 },
      });
    }

    if (task.userId && req.user && task.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        error: { message: "You do not have permission to delete this task.", status: 403 },
      });
    }

    await Task.findByIdAndDelete(id);

    logActivity("DELETE", task, req.ip);

    // Step 4: Invalidate cache after successful DELETE write
    cache.invalidateTasksCache(id);
    console.log(`[node-cache] Invalidated task caches following DELETE /tasks/${id}`);

    // Practical 10: Log API response timestamp and send 200 response BEFORE emitting event
    console.log(`[API] Response sent at ${new Date().toISOString()}`);
    res.status(200).json({
      message: `Task '${task.title}' deleted successfully.`,
      task,
    });

    // Emit event asynchronously AFTER response is sent (non-blocking)
    taskEvents.emit("task-deleted", task);
  } catch (err) {
    next(err);
  }
}

// Supplementary problem: Expose cache hits/misses counter & stats via debug endpoint
export function getCacheDebugStats(req, res) {
  const stats = cache.getStats();
  res.status(200).json({
    success: true,
    message: "node-cache in-memory caching statistics",
    ...stats,
  });
}

// Helper endpoint to flush cache for testing comparison
export function clearCacheDebug(req, res) {
  const result = cache.flush();
  res.status(200).json(result);
}

