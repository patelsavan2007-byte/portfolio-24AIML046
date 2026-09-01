import { Router } from "express";
import { requireTaskAuth } from "../middleware/requireTaskAuth.js";
import {
  register,
  login,
  loginWithGoogle,
  logout,
  getMe,
} from "../controllers/authController.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", loginWithGoogle);
router.post("/logout", logout);
router.get("/me", requireTaskAuth, getMe);

export default router;
