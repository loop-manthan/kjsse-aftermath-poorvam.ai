import express from "express";
import {
  submitReview,
  getUserReviews,
} from "../controllers/review.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/submit", authenticate, submitReview);
router.get("/user/:userId", getUserReviews);

export default router;
