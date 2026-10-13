import { Router } from "express";
import { optionalTaskAuth } from "../middleware/requireTaskAuth.js";
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  patchTask,
  deleteTask,
  getCacheDebugStats,
  clearCacheDebug,
} from "../controllers/taskController.js";

const router = Router();

// Practical 9 Supplementary: Cache debug, counter & management endpoints
router.get("/cache/stats", getCacheDebugStats);
router.get("/cache-stats", getCacheDebugStats);
router.get("/cache/clear", clearCacheDebug);
router.post("/cache/clear", clearCacheDebug);

// Standard task routes (optionalTaskAuth allows testing via Postman or browser with or without login)
router.get("/", optionalTaskAuth, listTasks);
router.get("/:id", optionalTaskAuth, getTask);
router.post("/", optionalTaskAuth, createTask);
router.put("/:id", optionalTaskAuth, updateTask);
router.patch("/:id", optionalTaskAuth, patchTask);
router.delete("/:id", optionalTaskAuth, deleteTask);

export default router;

