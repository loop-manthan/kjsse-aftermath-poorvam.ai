import express from "express";
import {
  register,
  login,
  getMe,
  updateProfile,
  updateAvailability,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, getMe);
router.patch("/profile", authenticate, updateProfile);
router.patch("/availability", authenticate, updateAvailability);

export default router;
