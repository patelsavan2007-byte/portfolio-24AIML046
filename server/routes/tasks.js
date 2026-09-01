import { Router } from "express";
import { requireTaskAuth, optionalTaskAuth } from "../middleware/requireTaskAuth.js";
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  patchTask,
  deleteTask,
} from "../controllers/taskController.js";

const router = Router();

router.get("/", requireTaskAuth, listTasks);
router.get("/:id", requireTaskAuth, getTask);
router.post("/", optionalTaskAuth, createTask);
router.put("/:id", requireTaskAuth, updateTask);
router.patch("/:id", requireTaskAuth, patchTask);
router.delete("/:id", requireTaskAuth, deleteTask);

export default router;
