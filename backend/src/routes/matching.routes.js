import express from "express";
import {
  findWorker,
  getNearbyJobs,
  getNearbyWorkers,
} from "../controllers/matching.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/find-worker", authenticate, findWorker);
router.get("/nearby-jobs/:workerId", authenticate, getNearbyJobs);
router.get("/nearby-workers", authenticate, getNearbyWorkers);

export default router;
