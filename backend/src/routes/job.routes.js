import express from "express";
import {
  createJob,
  getMyJobs,
  getJobById,
  acceptJob,
  startJob,
  completeJob,
  cancelJob,
  getAvailableJobs,
  applyToJob,
  markPaid,
} from "../controllers/job.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/create", authenticate, createJob);
router.get("/available", authenticate, getAvailableJobs);
router.get("/my-jobs", authenticate, getMyJobs);
router.get("/:jobId", authenticate, getJobById);
router.post("/:jobId/apply", authenticate, applyToJob);
router.patch("/:jobId/accept", authenticate, acceptJob);
router.patch("/:jobId/start", authenticate, startJob);
router.patch("/:jobId/complete", authenticate, completeJob);
router.patch("/:jobId/mark-paid", authenticate, markPaid);
router.patch("/:jobId/cancel", authenticate, cancelJob);

export default router;
